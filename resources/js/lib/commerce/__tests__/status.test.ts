import { orderStatusMeta, paymentStatusMeta, stockState } from '../status';

describe('status semantics', () => {
    it('maps backend enums regardless of case', () => {
        expect(orderStatusMeta('Processing').label).toBe('Processing');
        expect(orderStatusMeta('delivered').tone).toBe('success');
        expect(paymentStatusMeta('failed')).toMatchObject({ tone: 'danger', label: 'Payment failed' });
        expect(paymentStatusMeta('pending').label).toBe('Unpaid');
    });

    it('never renders an empty label for unknown states', () => {
        expect(orderStatusMeta('on_hold').label).toBe('on_hold');
        expect(orderStatusMeta(null).label).toBe('Unknown');
    });

    it('every status carries an icon so it is never colour-only', () => {
        for (const s of ['pending', 'processing', 'shipped', 'delivered', 'cancelled']) expect(orderStatusMeta(s).icon).toBeTruthy();
    });

    it('classifies stock against the store threshold', () => {
        expect(stockState(0, 20)).toBe('out_of_stock');
        expect(stockState(20, 20)).toBe('low_stock');
        expect(stockState(21, 20)).toBe('in_stock');
    });
});
