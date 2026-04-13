<?php

namespace App\Http\Controllers\Store;

use App\Http\Controllers\Controller;
use App\Services\OrderService;
use App\Services\CartCalculationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OrderController extends Controller
{
    protected $orderService;

    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    public function placeOrder(Request $request, $storeSlug)
    {
        $request->validate([
            'store_id' => 'required|exists:stores,id',
            'customer_first_name' => 'required|string|max:255',
            'customer_last_name' => 'required|string|max:255',
            'customer_email' => 'required|email|max:255',
            'customer_phone' => 'nullable|string|max:20',
            'shipping_address' => 'required|string|max:255',
            'shipping_city' => 'required|string|max:100',
            'shipping_state' => 'required|string|max:100',
            'shipping_postal_code' => 'required|string|max:20',
            'shipping_country' => 'required|string|max:100',
            'billing_address' => 'required|string|max:255',
            'billing_city' => 'required|string|max:100',
            'billing_state' => 'required|string|max:100',
            'billing_postal_code' => 'required|string|max:20',
            'billing_country' => 'required|string|max:100',
            'payment_method' => 'required|string',
            'shipping_method_id' => 'nullable|exists:shippings,id',
            'notes' => 'nullable|string',
            'coupon_code' => 'nullable|string',
        ]);

        try {
            // Get cart calculation
            $calculation = CartCalculationService::calculateCartTotals(
                $request->store_id,
                session()->getId(),
                $request->coupon_code,
                $request->shipping_method_id
            );

            if ($calculation['items']->isEmpty()) {
                return back()->withErrors(['cart' => 'Your cart is empty']);
            }

            // Prepare order data
            $orderData = [
                'store_id' => $request->store_id,
                'customer_first_name' => $request->customer_first_name,
                'customer_last_name' => $request->customer_last_name,
                'customer_email' => $request->customer_email,
                'customer_phone' => $request->customer_phone,
                'shipping_address' => $request->shipping_address,
                'shipping_city' => $request->shipping_city,
                'shipping_state' => $request->shipping_state,
                'shipping_postal_code' => $request->shipping_postal_code,
                'shipping_country' => $request->shipping_country,
                'billing_address' => $request->billing_address,
                'billing_city' => $request->billing_city,
                'billing_state' => $request->billing_state,
                'billing_postal_code' => $request->billing_postal_code,
                'billing_country' => $request->billing_country,
                'subtotal' => $calculation['subtotal'],
                'tax_amount' => $calculation['tax'],
                'shipping_amount' => $calculation['shipping'],
                'discount_amount' => $calculation['discount'],
                'total_amount' => $calculation['total'],
                'payment_method' => $request->payment_method,
                'shipping_method_id' => $request->shipping_method_id,
                'notes' => $request->notes,
                'coupon_code' => $request->coupon_code,
                'coupon_discount' => $calculation['discount'],
            ];

            // Prepare cart items
            $cartItems = $calculation['items']->map(function ($item) {
                return [
                    'product_id' => $item->product_id,
                    'name' => $item->product->name,
                    'sku' => $item->product->sku,
                    'price' => $item->product->price,
                    'sale_price' => $item->product->sale_price,
                    'quantity' => $item->quantity,
                    'variants' => $item->variants,
                ];
            })->toArray();

            // Create order
            $order = $this->orderService->createOrder($orderData, $cartItems);
            
            // Update coupon usage if coupon was used
            if ($request->coupon_code && $calculation['coupon']) {
                $calculation['coupon']->increment('used_count');
            }

            // Process payment
            $paymentResult = $this->orderService->processPayment($order, $storeSlug);

            if ($paymentResult['success']) {
                // For WhatsApp, redirect to WhatsApp URL
                if ($request->payment_method === 'whatsapp' && isset($paymentResult['whatsapp_url'])) {
                    return redirect()->route('store.order-confirmation', [
                        'storeSlug' => $storeSlug,
                        'orderNumber' => $order->order_number
                    ])->with([
                        'success' => $paymentResult['message'],
                        'whatsapp_url' => $paymentResult['whatsapp_url']
                    ]);
                }
                
                // For Stripe, PayPal, PayFast, and MercadoPago, redirect to checkout URL
                if (in_array($request->payment_method, ['stripe', 'paypal', 'payfast', 'mercadopago']) && isset($paymentResult['checkout_url'])) {
                    return redirect($paymentResult['checkout_url']);
                }
                
                // For PayFast, create auto-submit form (XSS PROTECTION ADDED)
                if ($request->payment_method === 'payfast' && isset($paymentResult['payfast_data'])) {
                    $htmlForm = '';
                    foreach ($paymentResult['payfast_data'] as $name => $value) {
                        $escapedName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
                        $escapedValue = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
                        $htmlForm .= '<input name="' . $escapedName . '" type="hidden" value="' . $escapedValue . '" />';
                    }

                    $escapedEndpoint = htmlspecialchars($paymentResult['payfast_endpoint'], ENT_QUOTES, 'UTF-8');
                    $autoSubmitForm = '<html><body><form id="payfast-form" method="POST" action="' . $escapedEndpoint . '">' .
                        $htmlForm .
                        '</form><script>document.getElementById("payfast-form").submit();</script></body></html>';

                    return response($autoSubmitForm);
                }
                
                return redirect()->route('store.order-confirmation', [
                    'storeSlug' => $storeSlug,
                    'orderNumber' => $order->order_number
                ])->with('success', $paymentResult['message']);
            } else {
                // If payment failed, cancel the order and restore inventory
                if (isset($order)) {
                    $this->orderService->cancelOrder($order);
                }
                return back()->withErrors(['payment' => $paymentResult['message']]);
            }

        } catch (\Exception $e) {
            // If order was created but payment failed, cancel it
            if (isset($order)) {
                try {
                    $this->orderService->cancelOrder($order);
                } catch (\Exception $cancelException) {
                    // Log the cancellation error but don't show it to user
                    \Log::error('Failed to cancel order after payment error', [
                        'order_id' => $order->id,
                        'error' => $cancelException->getMessage()
                    ]);
                }
            }
            return back()->withErrors(['error' => 'Failed to place order: ' . $e->getMessage()]);
        }
    }
}