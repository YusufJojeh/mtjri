import { AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame } from 'remotion';

import type { MarketingCompositionProps } from './brand';
import { floatOffset } from './lib';
import { marketingAssets } from './marketing-assets';
import { GlassCard, MarketingBackground } from './shared';

const SceneFrame = ({
    image,
    secondary,
    tertiary,
    frame,
}: {
    image: string;
    secondary?: string;
    tertiary?: string;
    frame: number;
}) => {
    const drift = floatOffset(frame, 8, 40);

    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                padding: '74px 80px',
            }}
        >
            <GlassCard
                style={{
                    position: 'absolute',
                    inset: '20px 240px 34px 0',
                    padding: 18,
                    transform: `translate3d(0, ${drift}px, 0)`,
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
                        src={staticFile(image)}
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

            {secondary ? (
                <GlassCard
                    style={{
                        position: 'absolute',
                        top: 40,
                        right: 0,
                        width: 380,
                        padding: 14,
                        transform: `translate3d(0, ${drift * -0.8}px, 0)`,
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
                            src={staticFile(secondary)}
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
            ) : null}

            {tertiary ? (
                <GlassCard
                    style={{
                        position: 'absolute',
                        right: 42,
                        bottom: 16,
                        width: 420,
                        padding: 14,
                        transform: `translate3d(0, ${drift * 0.7}px, 0)`,
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
                            src={staticFile(tertiary)}
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
            ) : null}
        </div>
    );
};

export const LandingFilm = (_props: MarketingCompositionProps) => {
    const frame = useCurrentFrame();

    return (
        <AbsoluteFill
            style={{
                fontFamily: '"Instrument Sans Variable", "Instrument Sans", Inter, system-ui, sans-serif',
            }}
        >
            <MarketingBackground frame={frame} />

            <Sequence from={0} durationInFrames={185}>
                <SceneFrame
                    image={marketingAssets.landing.dashboard}
                    secondary={marketingAssets.landing.themes}
                    tertiary={marketingAssets.landing.payments}
                    frame={frame}
                />
            </Sequence>
            <Sequence from={170} durationInFrames={185}>
                <SceneFrame
                    image={marketingAssets.landing.products}
                    secondary={marketingAssets.landing.orders}
                    tertiary={marketingAssets.landing.dashboard}
                    frame={frame}
                />
            </Sequence>
            <Sequence from={340} durationInFrames={185}>
                <SceneFrame
                    image={marketingAssets.landing.themes}
                    secondary={marketingAssets.landing.payments}
                    tertiary={marketingAssets.landing.blog}
                    frame={frame}
                />
            </Sequence>
            <Sequence from={510} durationInFrames={230}>
                <SceneFrame
                    image={marketingAssets.landing.dashboard}
                    secondary={marketingAssets.landing.products}
                    tertiary={marketingAssets.landing.orders}
                    frame={frame}
                />
            </Sequence>
        </AbsoluteFill>
    );
};
