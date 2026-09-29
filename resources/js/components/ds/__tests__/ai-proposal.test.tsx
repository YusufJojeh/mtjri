import { fireEvent, render, screen } from '@testing-library/react';
import { AiProposal } from '../ai';

describe('AiProposal', () => {
    const base = { field: 'Description', current: 'Old soft cotton shirt', onReject: jest.fn() };

    it('shows the change set and never applies without an explicit accept', () => {
        const onAccept = jest.fn();
        render(<AiProposal {...base} state={{ status: 'ready', value: 'New soft linen shirt' }} onAccept={onAccept} />);
        expect(screen.getByRole('region', { name: /AI proposal for/ })).toBeInTheDocument();
        expect(screen.getByText('cotton', { exact: false }).closest('del')).not.toBeNull();
        expect(screen.getByText('linen', { exact: false }).closest('ins')).not.toBeNull();
        expect(onAccept).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: /Accept/ }));
        expect(onAccept).toHaveBeenCalledWith('New soft linen shirt');
    });

    it('lets the merchant edit the proposal before using it', () => {
        const onAccept = jest.fn();
        render(<AiProposal {...base} state={{ status: 'ready', value: 'Draft' }} onAccept={onAccept} />);
        fireEvent.click(screen.getByRole('button', { name: /Edit/ }));
        fireEvent.change(screen.getByRole('textbox', { name: 'Edit proposal' }), { target: { value: 'My version' } });
        fireEvent.click(screen.getByRole('button', { name: /Use edited version/ }));
        expect(onAccept).toHaveBeenCalledWith('My version');
    });

    it('explains provider failures in merchant language and offers retry', () => {
        const onRegenerate = jest.fn();
        render(<AiProposal {...base} state={{ status: 'error', code: 'rate_limited' }} onAccept={jest.fn()} onRegenerate={onRegenerate} />);
        expect(screen.getByText('Too many requests')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Try again/ }));
        expect(onRegenerate).toHaveBeenCalled();
    });

    it('does not offer retry when AI is not configured', () => {
        render(<AiProposal {...base} state={{ status: 'error', code: 'not_configured' }} onAccept={jest.fn()} onRegenerate={jest.fn()} />);
        expect(screen.getByText('AI writing is not set up yet')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Try again/ })).toBeNull();
    });

    it('renders nothing when idle or already applied', () => {
        const { container, rerender } = render(<AiProposal {...base} state={{ status: 'idle' }} onAccept={jest.fn()} />);
        expect(container).toBeEmptyDOMElement();
        rerender(<AiProposal {...base} state={{ status: 'applied' }} onAccept={jest.fn()} />);
        expect(container).toBeEmptyDOMElement();
    });
});
