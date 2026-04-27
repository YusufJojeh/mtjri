import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';

import { marketingPalette } from './brand';

type BackgroundProps = {
    frame: number;
};

type GlassCardProps = {
    children: ReactNode;
    style?: CSSProperties;
};

type LogoPlateProps = {
    dark?: boolean;
    width?: number;
};

type ScreenCardProps = {
    src: string;
    label: string;
    title?: string;
    badge?: string;
    style?: CSSProperties;
    imageStyle?: CSSProperties;
    dark?: boolean;
};

type MetricChipProps = {
    value: string;
    label: string;
    style?: CSSProperties;
};

type ThemeRibbonProps = {
    themes: string[];
    style?: CSSProperties;
};

export const MarketingBackground = ({ frame }: BackgroundProps) => {
    const pulse = 0.86 + Math.sin(frame / 22) * 0.08;
    const travel = Math.sin(frame / 54) * 80;

    return (
        <AbsoluteFill
            style={{
                background: `linear-gradient(135deg, ${marketingPalette.canvas} 0%, #09172a 45%, #111827 100%)`,
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    inset: -240,
                    backgroundImage: [
                        'radial-gradient(circle at 18% 22%, rgba(30, 144, 255, 0.34), transparent 32%)',
                        'radial-gradient(circle at 82% 18%, rgba(56, 189, 248, 0.18), transparent 30%)',
                        'radial-gradient(circle at 72% 72%, rgba(255, 193, 7, 0.14), transparent 24%)',
                    ].join(','),
                    transform: `translate3d(${travel}px, 0, 0) scale(${pulse})`,
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: [
                        'linear-gradient(rgba(148, 163, 184, 0.06) 1px, transparent 1px)',
                        'linear-gradient(90deg, rgba(148, 163, 184, 0.06) 1px, transparent 1px)',
                    ].join(','),
                    backgroundSize: '90px 90px',
                    maskImage: 'radial-gradient(circle at center, rgba(0,0,0,0.82), transparent 82%)',
                    opacity: 0.5,
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage:
                        'radial-gradient(rgba(255,255,255,0.06) 0.75px, transparent 0.75px)',
                    backgroundSize: '24px 24px',
                    opacity: 0.08,
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    inset: '64px 56px auto auto',
                    width: 280,
                    height: 280,
                    borderRadius: 9999,
                    background:
                        'radial-gradient(circle, rgba(255, 193, 7, 0.2), rgba(255, 193, 7, 0.02) 56%, transparent 74%)',
                    filter: 'blur(18px)',
                    opacity: 0.72,
                }}
            />
        </AbsoluteFill>
    );
};

export const GlassCard = ({ children, style }: GlassCardProps) => {
    return (
        <div
            style={{
                borderRadius: 32,
                border: `1px solid ${marketingPalette.border}`,
                background: `linear-gradient(180deg, rgba(15, 23, 42, 0.78) 0%, ${marketingPalette.glass} 100%)`,
                boxShadow: '0 30px 80px rgba(2, 6, 23, 0.4)',
                backdropFilter: 'blur(22px)',
                overflow: 'hidden',
                ...style,
            }}
        >
            {children}
        </div>
    );
};

export const LogoPlate = ({ dark = false, width = 220 }: LogoPlateProps) => {
    const src = dark ? 'remotion/assets/logos/logo-light.png' : 'remotion/assets/logos/logo-dark.png';

    return (
        <div
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '18px 20px',
                borderRadius: 28,
                border: dark ? '1px solid rgba(255,255,255,0.16)' : '1px solid rgba(15,23,42,0.08)',
                background: dark ? 'rgba(15, 23, 42, 0.82)' : 'rgba(255,255,255,0.92)',
                boxShadow: dark
                    ? '0 24px 60px rgba(2, 6, 23, 0.38)'
                    : '0 20px 50px rgba(15, 23, 42, 0.12)',
            }}
        >
            <Img src={staticFile(src)} style={{ width, height: 'auto' }} />
        </div>
    );
};

export const ScreenCard = ({ src, label, title, badge, style, imageStyle, dark = true }: ScreenCardProps) => {
    return (
        <GlassCard
            style={{
                padding: 18,
                background: dark
                    ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.82) 0%, rgba(15, 23, 42, 0.7) 100%)'
                    : 'linear-gradient(180deg, rgba(255, 255, 255, 0.94) 0%, rgba(248, 250, 252, 0.9) 100%)',
                ...style,
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 16,
                }}
            >
                <div>
                    <p
                        style={{
                            margin: 0,
                            fontSize: 12,
                            fontWeight: 700,
                            letterSpacing: '0.22em',
                            textTransform: 'uppercase',
                            color: dark ? 'rgba(148, 163, 184, 0.9)' : '#64748b',
                        }}
                    >
                        {label}
                    </p>
                    {title ? (
                        <p
                            style={{
                                margin: '10px 0 0',
                                fontSize: 22,
                                lineHeight: 1.25,
                                fontWeight: 650,
                                color: dark ? marketingPalette.text : '#0f172a',
                            }}
                        >
                            {title}
                        </p>
                    ) : null}
                </div>
                {badge ? (
                    <div
                        style={{
                            borderRadius: 9999,
                            padding: '8px 14px',
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#0f172a',
                            background: `linear-gradient(135deg, ${marketingPalette.accent}, #ffe082)`,
                            boxShadow: '0 16px 30px rgba(255, 193, 7, 0.24)',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {badge}
                    </div>
                ) : null}
            </div>
            <div
                style={{
                    marginTop: 18,
                    borderRadius: 24,
                    overflow: 'hidden',
                    border: dark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(15,23,42,0.08)',
                    background: dark ? '#0b1324' : '#f8fafc',
                }}
            >
                <Img
                    src={staticFile(src)}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'top',
                        display: 'block',
                        ...imageStyle,
                    }}
                />
            </div>
        </GlassCard>
    );
};

export const MetricChip = ({ value, label, style }: MetricChipProps) => {
    return (
        <div
            style={{
                minWidth: 210,
                padding: '20px 22px',
                borderRadius: 24,
                border: `1px solid ${marketingPalette.border}`,
                background: 'rgba(255,255,255,0.06)',
                boxShadow: '0 20px 36px rgba(2, 6, 23, 0.2)',
                ...style,
            }}
        >
            <p
                style={{
                    margin: 0,
                    fontSize: 44,
                    lineHeight: 1,
                    fontWeight: 720,
                    letterSpacing: '-0.04em',
                    color: marketingPalette.text,
                }}
            >
                {value}
            </p>
            <p
                style={{
                    margin: '10px 0 0',
                    fontSize: 16,
                    lineHeight: 1.45,
                    color: marketingPalette.muted,
                }}
            >
                {label}
            </p>
        </div>
    );
};

export const ThemeRibbon = ({ themes, style }: ThemeRibbonProps) => {
    return (
        <div
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                ...style,
            }}
        >
            {themes.map((theme) => (
                <div
                    key={theme}
                    style={{
                        borderRadius: 9999,
                        padding: '10px 16px',
                        fontSize: 14,
                        fontWeight: 600,
                        color: marketingPalette.text,
                        border: `1px solid ${marketingPalette.softBorder}`,
                        background: 'rgba(255,255,255,0.06)',
                    }}
                >
                    {theme}
                </div>
            ))}
        </div>
    );
};
