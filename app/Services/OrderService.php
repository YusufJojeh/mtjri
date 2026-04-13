<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\CartItem;
use App\Models\Customer;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Stripe\Stripe;
use Stripe\PaymentIntent;
use Stripe\Checkout\Session;
use MercadoPago\SDK;
use MercadoPago\Preference;
use MercadoPago\Item;
use MercadoPago\Payer;

class OrderService
{
    public function createOrder(array $orderData, array $cartItems): Order
    {
        return DB::transaction(function () use ($orderData, $cartItems) {
            // For PayFast, create order with awaiting_payment status to prevent premature completion
            $initialStatus = $orderData['payment_method'] === 'payfast' ? 'awaiting_payment' : 'pending';
            $initialPaymentStatus = $orderData['payment_method'] === 'payfast' ? 'awaiting_payment' : 'pending';
            
            // Create the order
            $order = Order::create([
                'order_number' => Order::generateOrderNumber(),
                'store_id' => $orderData['store_id'],
                'customer_id' => Auth::guard('customer')->id(),
                'session_id' => session()->getId(),
                'status' => $initialStatus,
                'payment_status' => $initialPaymentStatus,
                
                // Customer info
                'customer_email' => $orderData['customer_email'],
                'customer_phone' => $orderData['customer_phone'],
                'customer_first_name' => $orderData['customer_first_name'],
                'customer_last_name' => $orderData['customer_last_name'],
                
                // Shipping address
                'shipping_address' => $orderData['shipping_address'],
                'shipping_city' => $orderData['shipping_city'],
                'shipping_state' => $orderData['shipping_state'],
                'shipping_postal_code' => $orderData['shipping_postal_code'],
                'shipping_country' => $orderData['shipping_country'],
                
                // Billing address
                'billing_address' => $orderData['billing_address'],
                'billing_city' => $orderData['billing_city'],
                'billing_state' => $orderData['billing_state'],
                'billing_postal_code' => $orderData['billing_postal_code'],
                'billing_country' => $orderData['billing_country'],
                
                // Pricing
                'subtotal' => $orderData['subtotal'],
                'tax_amount' => $orderData['tax_amount'],
                'shipping_amount' => $orderData['shipping_amount'],
                'discount_amount' => $orderData['discount_amount'],
                'total_amount' => $orderData['total_amount'],
                
                // Payment info
                'payment_method' => $orderData['payment_method'],
                'payment_gateway' => $orderData['payment_gateway'] ?? null,
                
                // Shipping info
                'shipping_method_id' => $orderData['shipping_method_id'] ?? null,
                
                // Additional info
                'notes' => $orderData['notes'] ?? null,
                'coupon_code' => $orderData['coupon_code'] ?? null,
                'coupon_discount' => $orderData['coupon_discount'] ?? 0,
            ]);

            // Create order items and update inventory
            foreach ($cartItems as $cartItem) {
                $unitPrice = $cartItem['sale_price'] ?? $cartItem['price'];
                
                // Check and update product inventory
                $product = Product::find($cartItem['product_id']);
                if ($product) {
                    if ($product->stock < $cartItem['quantity']) {
                        throw new \Exception("Insufficient stock for product: {$cartItem['name']}");
                    }
                    
                    // Reduce product stock
                    $product->decrement('stock', $cartItem['quantity']);
                }
                
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $cartItem['product_id'],
                    'product_name' => $cartItem['name'],
                    'product_sku' => $cartItem['sku'] ?? null,
                    'product_price' => $cartItem['price'],
                    'quantity' => $cartItem['quantity'],
                    'product_variants' => $cartItem['variants'] ?? null,
                    'unit_price' => $unitPrice,
                    'total_price' => $unitPrice * $cartItem['quantity'],
                ]);
            }

            // Clear cart items after order creation
            $this->clearCart($orderData['store_id']);

            return $order;
        });
    }

    public function processPayment(Order $order, string $storeSlug = null): array
    {
        switch ($order->payment_method) {
            case 'cod':
                return $this->processCashOnDelivery($order);
            case 'whatsapp':
                return $this->processWhatsAppPayment($order);
            case 'stripe':
                return $this->processStripePayment($order, $storeSlug);
            case 'paypal':
                return $this->processPayPalPayment($order, $storeSlug);
            case 'payfast':
                return $this->processPayFastPayment($order, $storeSlug);
            case 'mercadopago':
                return $this->processMercadoPagoPayment($order, $storeSlug);
            case 'razorpay':
                return $this->processRazorpayPayment($order);
            default:
                return ['success' => false, 'message' => 'Unsupported payment method: ' . $order->payment_method];
        }
    }

    private function processCashOnDelivery(Order $order): array
    {
        $order->update([
            'status' => 'pending',
            'payment_status' => 'pending',
            'payment_gateway' => 'cod',
        ]);

        return [
            'success' => true,
            'message' => 'Order placed successfully. Payment will be collected on delivery.',
            'order_id' => $order->id,
            'order_number' => $order->order_number,
        ];
    }

    private function processWhatsAppPayment(Order $order): array
    {
        $store = \App\Models\Store::find($order->store_id);
        
        if (!$store || !$store->user) {
            return ['success' => false, 'message' => 'Store configuration error'];
        }

        // Get payment settings for the store owner (company/user)
        $paymentSettings = getPaymentSettings($store->user->id, $order->store_id);
        
        // Check if WhatsApp payment is enabled (priority: payment settings > store settings)
        $isWhatsAppEnabled = ($paymentSettings['is_whatsapp_enabled'] ?? false) || ($store->pay_with_whatsapp ?? false);
        
        // Get WhatsApp number (priority: payment settings > store settings)
        $whatsappNumber = null;
        if (!empty($paymentSettings['whatsapp_number'])) {
            $whatsappNumber = $paymentSettings['whatsapp_number'];
        } elseif (!empty($store->whatsapp_number)) {
            $whatsappNumber = $store->whatsapp_number;
        }
        
        if (!$isWhatsAppEnabled || !$whatsappNumber) {
            return ['success' => false, 'message' => 'WhatsApp payment is not enabled for this store'];
        }

        // Update order status
        $order->update([
            'status' => 'pending',
            'payment_status' => 'pending',
            'payment_gateway' => 'whatsapp',
        ]);

        // Build order invoice message to send TO the company/user (store owner)
        $storeName = $store->name ?? $store->title ?? 'Store';
        
        // Format WhatsApp invoice message (in Arabic - invoice to store owner)
        $message = "📦 *فاتورة طلب جديد*\n\n";
        $message .= "*المتجر:* {$storeName}\n";
        $message .= "*رقم الطلب:* {$order->order_number}\n";
        $message .= "*التاريخ:* " . date('Y-m-d H:i:s') . "\n\n";
        
        // Order items
        $message .= "*المنتجات:*\n";
        $items = $order->items;
        foreach ($items as $item) {
            $message .= "• {$item->product_name}\n";
            $message .= "  الكمية: {$item->quantity}\n";
            $message .= "  السعر: " . number_format($item->total_price, 2) . "\n\n";
        }
        
        // Order totals
        $message .= "*ملخص الطلب:*\n";
        $message .= "المجموع الفرعي: " . number_format($order->subtotal ?? $order->total_amount, 2) . "\n";
        if (($order->discount_amount ?? 0) > 0) {
            $message .= "الخصم: -" . number_format($order->discount_amount, 2) . "\n";
        }
        if (($order->shipping_amount ?? 0) > 0) {
            $message .= "الشحن: " . number_format($order->shipping_amount, 2) . "\n";
        }
        if (($order->tax_amount ?? 0) > 0) {
            $message .= "الضريبة: " . number_format($order->tax_amount, 2) . "\n";
        }
        $message .= "*الإجمالي: " . number_format($order->total_amount, 2) . "*\n\n";
        
        // Customer information
        $message .= "*معلومات العميل:*\n";
        $message .= "الاسم: {$order->customer_first_name} {$order->customer_last_name}\n";
        $message .= "البريد الإلكتروني: {$order->customer_email}\n";
        if ($order->customer_phone) {
            $message .= "الهاتف: {$order->customer_phone}\n";
        }
        $message .= "\n";
        
        // Shipping address
        $message .= "*عنوان الشحن:*\n";
        $message .= "{$order->shipping_address}\n";
        $message .= "{$order->shipping_city}";
        if ($order->shipping_state) {
            $message .= ", {$order->shipping_state}";
        }
        if ($order->shipping_postal_code) {
            $message .= " {$order->shipping_postal_code}";
        }
        $message .= "\n{$order->shipping_country}\n\n";
        
        $message .= "💬 *تم اختيار الدفع عبر واتساب*\n";
        $message .= "يرجى التواصل مع العميل لإتمام عملية الدفع.";

        // Clean WhatsApp number (remove +, spaces, etc.)
        $cleanWhatsAppNumber = preg_replace('/[^0-9]/', '', $whatsappNumber);
        
        // Generate WhatsApp URL - this will open WhatsApp with the invoice message ready to send TO the store owner
        $whatsappUrl = "https://wa.me/{$cleanWhatsAppNumber}?text=" . urlencode($message);

        return [
            'success' => true,
            'message' => 'Order placed successfully. The invoice will be sent to the store owner via WhatsApp.',
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'whatsapp_url' => $whatsappUrl,
        ];
    }

    private function processStripePayment(Order $order, string $storeSlug = null): array
    {
        try {
            // Get store owner's Stripe settings
            $storeModel = \App\Models\Store::find($order->store_id);
            if (!$storeModel || !$storeModel->user) {
                return ['success' => false, 'message' => 'Store configuration error'];
            }
            
            $stripeConfig = getPaymentMethodConfig('stripe', $storeModel->user->id, $order->store_id);
            
            if (!$stripeConfig['enabled'] || !$stripeConfig['secret']) {
                return ['success' => false, 'message' => 'Stripe is not configured for this store'];
            }
            
            Stripe::setApiKey($stripeConfig['secret']);
            
            // Create checkout session
            $checkoutSession = Session::create([
                'payment_method_types' => ['card'],
                'line_items' => [[
                    'price_data' => [
                        'currency' => 'usd',
                        'product_data' => [
                            'name' => "Order #{$order->order_number}",
                        ],
                        'unit_amount' => intval($order->total_amount * 100),
                    ],
                    'quantity' => 1,
                ]],
                'mode' => 'payment',
                'success_url' => route('store.stripe.success', ['storeSlug' => $storeSlug ?: $storeModel->slug, 'orderNumber' => $order->order_number]),
                'cancel_url' => route('store.checkout', ['storeSlug' => $storeSlug ?: $storeModel->slug]),
                'metadata' => [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'store_id' => $order->store_id,
                ],
            ]);
            
            $order->update([
                'payment_gateway' => 'stripe',
                'payment_transaction_id' => $checkoutSession->id,
                'payment_details' => [
                    'checkout_session_id' => $checkoutSession->id,
                ],
            ]);
            
            return [
                'success' => true,
                'message' => 'Stripe checkout session created',
                'checkout_url' => $checkoutSession->url,
                'order_id' => $order->id,
                'order_number' => $order->order_number,
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Stripe payment failed: ' . $e->getMessage()
            ];
        }
    }

    private function processPayPalPayment(Order $order, string $storeSlug = null): array
    {
        try {
            // Get store owner's PayPal settings
            $storeModel = \App\Models\Store::find($order->store_id);
            if (!$storeModel || !$storeModel->user) {
                return ['success' => false, 'message' => 'Store configuration error'];
            }
            
            $paypalConfig = getPaymentMethodConfig('paypal', $storeModel->user->id, $order->store_id);
            
            if (!$paypalConfig['enabled'] || !$paypalConfig['client_id'] || !$paypalConfig['secret']) {
                return ['success' => false, 'message' => 'PayPal is not configured for this store'];
            }
            
            // Use direct PayPal API calls
            $baseUrl = $paypalConfig['mode'] === 'live' ? 'https://api.paypal.com' : 'https://api.sandbox.paypal.com';
            
            // Get access token
            $tokenResponse = \Http::withBasicAuth($paypalConfig['client_id'], $paypalConfig['secret'])
                ->asForm()
                ->post($baseUrl . '/v1/oauth2/token', [
                    'grant_type' => 'client_credentials'
                ]);
            
            if (!$tokenResponse->successful()) {
                return ['success' => false, 'message' => 'PayPal authentication failed'];
            }
            
            $accessToken = $tokenResponse->json()['access_token'];
            
            // Create PayPal order
            $orderResponse = \Http::withToken($accessToken)
                ->post($baseUrl . '/v2/checkout/orders', [
                    'intent' => 'CAPTURE',
                    'application_context' => [
                        'return_url' => url('/store/' . ($storeSlug ?: $storeModel->slug) . '/paypal/success/' . $order->order_number),
                        'cancel_url' => url('/store/' . ($storeSlug ?: $storeModel->slug) . '/checkout'),
                    ],
                    'purchase_units' => [
                        [
                            'amount' => [
                                'currency_code' => 'USD',
                                'value' => number_format($order->total_amount, 2, '.', ''),
                            ],
                            'description' => "Order #{$order->order_number}",
                        ]
                    ],
                ]);
            
            if (!$orderResponse->successful()) {
                return ['success' => false, 'message' => 'PayPal order creation failed: ' . $orderResponse->body()];
            }
            
            $paypalOrder = $orderResponse->json();
            
            if (isset($paypalOrder['id'])) {
                $order->update([
                    'payment_gateway' => 'paypal',
                    'payment_transaction_id' => $paypalOrder['id'],
                    'payment_details' => [
                        'paypal_order_id' => $paypalOrder['id'],
                    ],
                ]);
                
                // Get approval URL
                $approvalUrl = collect($paypalOrder['links'])->firstWhere('rel', 'approve')['href'] ?? null;
                
                return [
                    'success' => true,
                    'message' => 'PayPal order created successfully',
                    'checkout_url' => $approvalUrl,
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                ];
            } else {
                return ['success' => false, 'message' => 'Failed to create PayPal order: ' . json_encode($paypalOrder)];
            }
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'PayPal payment failed: ' . $e->getMessage()
            ];
        }
    }

    private function processPayFastPayment(Order $order, string $storeSlug = null): array
    {
        try {
            // Get store owner's PayFast settings
            $storeModel = \App\Models\Store::find($order->store_id);
            if (!$storeModel || !$storeModel->user) {
                return ['success' => false, 'message' => 'Store configuration error'];
            }
            
            $payfastConfig = getPaymentMethodConfig('payfast', $storeModel->user->id, $order->store_id);
            
            if (!$payfastConfig['enabled'] || !$payfastConfig['merchant_id'] || !$payfastConfig['merchant_key']) {
                return ['success' => false, 'message' => 'PayFast is not configured for this store'];
            }
            
            if ($order->total_amount < 5.00) {
                return ['success' => false, 'message' => 'Minimum amount is R5.00'];
            }
            
            $paymentId = 'store_pf_' . $order->id . '_' . time() . '_' . uniqid();
            
            $data = [
                'merchant_id' => $payfastConfig['merchant_id'],
                'merchant_key' => $payfastConfig['merchant_key'],
                'return_url' => route('store.payfast.success', ['storeSlug' => $storeSlug ?: $storeModel->slug, 'orderNumber' => $order->order_number]),
                'cancel_url' => route('store.checkout', ['storeSlug' => $storeSlug ?: $storeModel->slug]),
                'notify_url' => route('store.payfast.callback'),
                'name_first' => $order->customer_first_name,
                'name_last' => $order->customer_last_name,
                'email_address' => $order->customer_email,
                'm_payment_id' => $paymentId,
                'amount' => number_format($order->total_amount, 2, '.', ''),
                'item_name' => "Order #{$order->order_number}",
            ];
            
            $passphrase = $payfastConfig['passphrase'] ?? '';
            $signature = $this->generatePayFastSignature($data, $passphrase);
            $data['signature'] = $signature;
            
            $order->update([
                'payment_gateway' => 'payfast',
                'payment_transaction_id' => $paymentId,
                'payment_details' => [
                    'payfast_payment_id' => $paymentId,
                ],
            ]);
            
            $htmlForm = '';
            foreach ($data as $name => $value) {
                $htmlForm .= '<input name="' . $name . '" type="hidden" value="' . $value . '" />';
            }
            
            $isLive = ($payfastConfig['mode'] ?? 'sandbox') === 'live';
            $endpoint = $isLive 
                ? 'https://www.payfast.co.za/eng/process' 
                : 'https://sandbox.payfast.co.za/eng/process';
            
            return [
                'success' => true,
                'message' => 'PayFast payment form created',
                'payfast_data' => $data,
                'payfast_endpoint' => $endpoint,
                'order_id' => $order->id,
                'order_number' => $order->order_number,
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'PayFast payment failed: ' . $e->getMessage()
            ];
        }
    }
    
    private function generatePayFastSignature($data, $passPhrase = null)
    {
        $pfOutput = '';
        foreach ($data as $key => $val) {
            if ($val !== '') {
                $pfOutput .= $key . '=' . urlencode(trim($val)) . '&';
            }
        }
        
        $getString = substr($pfOutput, 0, -1);
        if ($passPhrase !== null) {
            $getString .= '&passphrase=' . urlencode(trim($passPhrase));
        }
        return md5($getString);
    }

    private function processMercadoPagoPayment(Order $order, string $storeSlug = null): array
    {
        try {
            // Get store owner's MercadoPago settings
            $storeModel = \App\Models\Store::find($order->store_id);
            if (!$storeModel || !$storeModel->user) {
                return ['success' => false, 'message' => 'Store configuration error'];
            }
            
            $mercadopagoConfig = getPaymentMethodConfig('mercadopago', $storeModel->user->id, $order->store_id);
            
            if (!$mercadopagoConfig['enabled'] || !$mercadopagoConfig['access_token']) {
                return ['success' => false, 'message' => 'MercadoPago is not configured for this store'];
            }
            
            // Initialize MercadoPago SDK
            SDK::setAccessToken($mercadopagoConfig['access_token']);
            SDK::setIntegratorId("dev_vcardgo");
            
            // Create preference
            $preference = new Preference();
            
            // Create item
            $item = new Item();
            $item->title = "Order #{$order->order_number}";
            $item->quantity = 1;
            $item->unit_price = (float)$order->total_amount;
            $item->currency_id = $mercadopagoConfig['currency'] ?? ($mercadopagoConfig['mode'] === 'live' ? 'BRL' : 'BRL');
            $item->id = "order_" . $order->id;
            
            $preference->items = [$item];
            
            // Set back URLs
            $preference->back_urls = [
                "success" => route('store.mercadopago.success', ['storeSlug' => $storeSlug ?: $storeModel->slug, 'orderNumber' => $order->order_number]),
                "failure" => route('store.checkout', ['storeSlug' => $storeSlug ?: $storeModel->slug]),
                "pending" => route('store.mercadopago.success', ['storeSlug' => $storeSlug ?: $storeModel->slug, 'orderNumber' => $order->order_number])
            ];
            
            // Set external reference
            $preference->external_reference = 'store_order_' . $order->id . '_' . time();
            
            // Set notification URL
            $preference->notification_url = route('store.mercadopago.callback');
            
            // Set binary mode
            $preference->binary_mode = true;
            
            // Set payer information
            $payer = new Payer();
            $payer->name = $order->customer_first_name . ' ' . $order->customer_last_name;
            $payer->email = $order->customer_email;
            $preference->payer = $payer;
            
            // Save preference
            $result = $preference->save();
            
            if (!$result || !$preference->id) {
                return ['success' => false, 'message' => 'Failed to create MercadoPago preference'];
            }
            
            // Update order with payment details
            $order->update([
                'payment_gateway' => 'mercadopago',
                'payment_transaction_id' => $preference->id,
                'payment_details' => [
                    'preference_id' => $preference->id,
                ],
            ]);
            
            // Determine redirect URL based on mode
            $redirectUrl = ($mercadopagoConfig['mode'] ?? 'sandbox') === 'sandbox' 
                ? $preference->sandbox_init_point 
                : $preference->init_point;
            
            return [
                'success' => true,
                'message' => 'MercadoPago preference created successfully',
                'checkout_url' => $redirectUrl,
                'order_id' => $order->id,
                'order_number' => $order->order_number,
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'MercadoPago payment failed: ' . $e->getMessage()
            ];
        }
    }

    private function processRazorpayPayment(Order $order): array
    {
        // TODO: Implement Razorpay payment processing
        return ['success' => false, 'message' => 'Razorpay payment not implemented yet'];
    }

    private function clearCart(int $storeId): void
    {
        $query = CartItem::where('store_id', $storeId);
        
        if (Auth::guard('customer')->check()) {
            $query->where('customer_id', Auth::guard('customer')->id());
        } else {
            $query->where('session_id', session()->getId())
                  ->whereNull('customer_id');
        }
        
        $query->delete();
    }
    
    /**
     * Cancel order and restore inventory for failed payments
     */
    public function cancelOrder(Order $order): void
    {
        DB::transaction(function () use ($order) {
            // Restore product inventory
            foreach ($order->items as $orderItem) {
                $product = Product::find($orderItem->product_id);
                if ($product) {
                    $product->increment('stock', $orderItem->quantity);
                }
            }
            
            // Update order status
            $order->update([
                'status' => 'cancelled',
                'payment_status' => 'failed',
                'payment_details' => array_merge($order->payment_details ?? [], [
                    'cancelled_at' => now(),
                    'cancellation_reason' => 'Payment not completed'
                ])
            ]);
        });
    }
}