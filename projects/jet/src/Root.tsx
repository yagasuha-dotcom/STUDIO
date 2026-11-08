import { Composition } from 'remotion';
import { FighterJetAnimation } from './FighterJet';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="FighterJet"
        component={FighterJetAnimation}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1080}
      />
    </>
  );
};
