import { AbsoluteFill, Img, staticFile, useCurrentFrame } from 'remotion';

import type { MarketingCompositionProps } from './brand';
import { floatOffset } from './lib';
import { marketingAssets } from './marketing-assets';
import { GlassCard, MarketingBackground } from './shared';

export const HeroFilm = (_props: MarketingCompositionProps) => {
    const frame = useCurrentFrame();
    const slowFloat = floatOffset(frame, 10, 48);
    const mediumFloat = floatOffset(frame, 8, 36, 12);
    const fastFloat = floatOffset(frame, 6, 28, 18);

    return (
        <AbsoluteFill
            style={{
                fontFamily: '"Instrument Sans Variable", "Instrument Sans", Inter, system-ui, sans-serif',
            }}
        >
            <MarketingBackground frame={frame} />

            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    padding: '70px 78px',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        inset: '20% 10% auto 10%',
                        height: 260,
                        borderRadius: 9999,
                        background:
                            'radial-gradient(circle, rgba(30,144,255,0.34), rgba(30,144,255,0.08) 56%, transparent 76%)',
                        filter: 'blur(30px)',
                        transform: `translate3d(0, ${slowFloat}px, 0)`,
                    }}
                />

                <GlassCard
                    style={{
                        position: 'absolute',
                        inset: '80px 230px 120px 0',
                        padding: 18,
                        transform: `translate3d(0, ${mediumFloat}px, 0)`,
                    }}
                >
                    <div
                        style={{
                            borderRadius: 30,
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.08)',
                        }}
                    >
                        <Img
                            src={staticFile(marketingAssets.landing.dashboard)}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: 'top',
                                display: 'block',
                            }}
                        />
                    </div>
                </GlassCard>

                <GlassCard
                    style={{
                        position: 'absolute',
                        top: 64,
                        right: 0,
                        width: 380,
                        padding: 14,
                        transform: `translate3d(0, ${fastFloat}px, 0)`,
                    }}
                >
                    <div
                        style={{
                            borderRadius: 24,
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.08)',
                        }}
                    >
                        <Img
                            src={staticFile(marketingAssets.landing.themes)}
                            style={{
                                width: '100%',
                                height: 220,
                                objectFit: 'cover',
                                objectPosition: 'top',
                                display: 'block',
                            }}
                        />
                    </div>
                </GlassCard>

                <GlassCard
                    style={{
                        position: 'absolute',
                        right: 44,
                        bottom: 40,
                        width: 420,
                        padding: 14,
                        transform: `translate3d(0, ${mediumFloat * -0.8}px, 0)`,
                    }}
                >
                    <div
                        style={{
                            borderRadius: 24,
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.08)',
                        }}
                    >
                        <Img
                            src={staticFile(marketingAssets.landing.payments)}
                            style={{
                                width: '100%',
                                height: 240,
                                objectFit: 'cover',
                                objectPosition: 'top',
                                display: 'block',
                            }}
                        />
                    </div>
                </GlassCard>
            </div>
        </AbsoluteFill>
    );
};
