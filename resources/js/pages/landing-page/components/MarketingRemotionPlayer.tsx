import React from 'react';
import { Player } from '@remotion/player';
import { useTranslation } from 'react-i18next';

import { HeroFilm } from '@/remotion/HeroFilm';
import { LandingFilm } from '@/remotion/LandingFilm';
import type { MarketingCompositionProps } from '@/remotion/brand';

type Variant = 'hero' | 'landing';

interface MarketingRemotionPlayerProps {
    variant: Variant;
    className?: string;
    showControls?: boolean;
}

function useMarketingProps(): MarketingCompositionProps {
    const { t } = useTranslation();

    return React.useMemo(
        () => ({
            brandName: 'MTJRii',
            eyebrow: t('landing.cinematic.hero.eyebrow'),
            title: t('landing.cinematic.hero.title'),
            subtitle: t('landing.cinematic.hero.subtitle'),
            primaryCta: t('landing.cinematic.hero.primaryCta'),
            closingTitle: t('landing.cinematic.motion.title'),
            closingBody: t('landing.cinematic.motion.subtitle'),
            proofPoints: [
                t('landing.cinematic.proof.items.one'),
                t('landing.cinematic.proof.items.two'),
                t('landing.cinematic.proof.items.three'),
            ],
            metrics: [
                {
                    value: '10',
                    label: t('landing.cinematic.templates.badge'),
                },
                {
                    value: '30+',
                    label: t('landing.cinematic.media.cards.payments.label'),
                },
                {
                    value: '1',
                    label: t('landing.cinematic.story.items.workspace.title'),
                },
            ],
            themes: [
                t('landing.cinematic.templates.items.one'),
                t('landing.cinematic.templates.items.two'),
                t('landing.cinematic.templates.items.three'),
                t('landing.cinematic.templates.items.four'),
                t('landing.cinematic.templates.items.five'),
                t('landing.cinematic.templates.items.six'),
            ],
        }),
        [t],
    );
}

export default function MarketingRemotionPlayer({
    variant,
    className,
    showControls = false,
}: MarketingRemotionPlayerProps) {
    const inputProps = useMarketingProps();

    const composition =
        variant === 'hero'
            ? {
                  component: HeroFilm,
                  durationInFrames: 390,
              }
            : {
                  component: LandingFilm,
                  durationInFrames: 740,
              };

    return (
        <Player
            component={composition.component}
            durationInFrames={composition.durationInFrames}
            compositionWidth={1920}
            compositionHeight={1080}
            fps={30}
            autoPlay
            loop
            initiallyMuted
            controls={showControls}
            clickToPlay={false}
            spaceKeyToPlayOrPause={false}
            doubleClickToFullscreen
            inputProps={inputProps}
            className={className}
            style={{ width: '100%', height: '100%' }}
        />
    );
}
