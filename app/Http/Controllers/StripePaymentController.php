<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\User;
use App\Models\Setting;
use App\Models\PlanOrder;
use App\Models\PaymentSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Stripe\Stripe;
use Stripe\PaymentIntent;

class StripePaymentController extends Controller
{

public function processPayment(Request $request)
{
    $validated = validatePaymentRequest($request, [
        'payment_method_id' => 'required|string',
        'cardholder_name'   => 'required|string',
        'plan_id'           => 'required|integer|exists:plans,id',
        'billing_cycle'     => 'required|in:monthly,yearly',
        'coupon_code'       => 'nullable|string',
        'store_id'          => 'nullable|integer', // إن وجد
    ]);

    try {
        $plan     = Plan::findOrFail($validated['plan_id']);
        $pricing  = calculatePlanPricing($plan, $validated['coupon_code'] ?? null);

        $user     = auth()->user();
        // حدّد مالك المتجر (company owner) والـ store
        $storeId  = $validated['store_id'] ?? session('current_store_id') ?? ($user->store_id ?? null);
        $ownerId  = $user->created_by ?: $user->id; // المالك الحقيقي لإعدادات الدفع

        // جِب إعدادات الدفع الفعّالة: (store يغلّب > user > env)
        $gateway  = \App\Models\PaymentSetting::getEffectiveSettings($ownerId, $storeId);
        // جِب إعدادات عامة للّعملة من نفس المالك
        $general  = settings($ownerId);

        $stripeSecret = $gateway['stripe_secret'] ?? null;
        $stripeKey    = $gateway['stripe_key']    ?? null;

        if (!$stripeSecret || !$stripeKey) {
            return back()->withErrors(['error' => __('Stripe not configured for this store/company')]);
        }

        if (!Str::startsWith($stripeSecret, 'sk_')) {
            return back()->withErrors(['error' => __('Invalid Stripe secret key format')]);
        }

        Stripe::setApiKey($stripeSecret);

        $currency = strtolower($general['defaultCurrency'] ?? 'usd');

        $amount   = (int) round($pricing['final_price'] * 100);

        $paymentIntent = PaymentIntent::create([
            'amount'               => $amount,
            'currency'             => $currency,
            'payment_method'       => $validated['payment_method_id'],
            'confirmation_method'  => 'manual',
            'confirm'              => true,
            'return_url'           => route('plans.index'),
            'description'          => 'Subscription to '.$plan->name.' plan',
            'metadata'             => [
                'user_id'   => $user->id,
                'plan_id'   => $plan->id,
                'store_id'  => $storeId,
                'cycle'     => $validated['billing_cycle'],
            ],
            'shipping' => [
                'name'    => $validated['cardholder_name'],
                'address' => [
                    'line1'       => 'Address Line 1',
                    'city'        => 'City',
                    'country'     => 'IN',
                    'postal_code' => '000000',
                ],
            ],
        ], [
            // حتى ما تتكرر العملية لو رجع الطلب:
            'idempotency_key' => 'pay_'.($storeId ?? 'na').'_'.$user->id.'_'.$plan->id.'_'.now()->timestamp,
        ]);

        if ($paymentIntent->status === 'succeeded') {
            processPaymentSuccess([
                'user_id'       => $user->id,
                'plan_id'       => $plan->id,
                'billing_cycle' => $validated['billing_cycle'],
                'payment_method'=> 'stripe',
                'coupon_code'   => $validated['coupon_code'] ?? null,
                'payment_id'    => $paymentIntent->id,
            ]);

            return back()->with('success', __('Payment successful and plan activated'));
        }

        return back()->withErrors(['error' => __('Payment failed')]);

    } catch (\Exception $e) {
        // لوج مفيد للتشخيص
        \Log::warning('STRIPE_FAIL', [
            'user' => auth()->id(),
            'store'=> $storeId ?? null,
            'msg'  => $e->getMessage(),
        ]);
        return handlePaymentError($e, 'stripe');
    }
}

}