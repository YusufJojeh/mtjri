import { Composition, Folder } from 'remotion';

import { defaultMarketingProps } from './brand';
import { HeroFilm } from './HeroFilm';
import { LandingFilm } from './LandingFilm';

export const RemotionRoot = () => {
    return (
        <Folder name="Marketing">
            <Composition
                id="MTJRiiHeroFilm"
                component={HeroFilm}
                durationInFrames={390}
                fps={30}
                width={1920}
                height={1080}
                defaultProps={defaultMarketingProps}
            />
            <Composition
                id="MTJRiiLandingFilm"
                component={LandingFilm}
                durationInFrames={740}
                fps={30}
                width={1920}
                height={1080}
                defaultProps={defaultMarketingProps}
            />
        </Folder>
    );
};
