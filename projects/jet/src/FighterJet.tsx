import React from 'react';
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const FighterJetAnimation: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Scene 1 Intro (0 - 90)
  const introScale = spring({ frame, fps, config: { damping: 12 } });

  // Scene 2 Single Engine (90 - 210)
  const scene2Frame = frame - 90;
  const jet1X = interpolate(scene2Frame, [0, 60], [-300, width / 2], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const jet1Y = interpolate(scene2Frame, [0, 60], [height + 200, height / 2], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const jet1Bounce = Math.sin(scene2Frame / 5) * 20; // Efek terbang oleng lucu

  // Scene 3 Double Engine (210 - 330)
  const scene3Frame = frame - 210;
  const jet2X = interpolate(scene3Frame, [0, 60], [width + 300, width / 2], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const muscleScale = spring({ frame: scene3Frame - 30, fps, config: { damping: 10 } });

  // Scene 4 Conclusion (330 - 450)
  const scene4Frame = frame - 330;
  const outScale = spring({ frame: scene4Frame, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill style={{ backgroundColor: '#87CEEB', fontFamily: 'sans-serif' }}>
      {/* Background Awan Lucu */}
      <AbsoluteFill>
         <div style={{ position: 'absolute', top: '10%', left: '10%', fontSize: '100px', opacity: 0.8 }}>☁️</div>
         <div style={{ position: 'absolute', top: '30%', right: '20%', fontSize: '150px', opacity: 0.6 }}>☁️</div>
         <div style={{ position: 'absolute', bottom: '20%', left: '30%', fontSize: '120px', opacity: 0.7 }}>☁️</div>
      </AbsoluteFill>

      {/* Scene 1: Judul */}
      <Sequence from={0} durationInFrames={90}>
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div style={{
            transform: `scale(${introScale})`,
            textAlign: 'center',
            fontSize: '70px',
            fontWeight: 'bold',
            color: 'white',
            textShadow: '5px 5px 0px #000',
            backgroundColor: '#FF4500',
            padding: '40px',
            borderRadius: '30px'
          }}>
            🤔 Jet Tempur:<br/>1 Mesin vs 2 Mesin?<br/>Kok Beda? ✈️
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Scene 2: Jet 1 Mesin */}
      <Sequence from={90} durationInFrames={120}>
         <AbsoluteFill style={{ alignItems: 'center' }}>
            <div style={{
              marginTop: '100px',
              fontSize: '60px',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '3px 3px 0px #000',
              textAlign: 'center',
              opacity: interpolate(scene2Frame, [0, 15], [0, 1])
            }}>
              Jet 1 Mesin (F-16, Gripen) <br/> 🏃‍♂️ Si Lincah & Irit! 💸
            </div>
            <div style={{
              position: 'absolute',
              fontSize: '250px',
              left: jet1X - 125,
              top: jet1Y + jet1Bounce - 125,
              transform: `rotate(15deg)`
            }}>
              🛩️
            </div>
            <div style={{
               position: 'absolute',
               bottom: '150px',
               fontSize: '40px',
               fontWeight: 'bold',
               backgroundColor: 'white',
               padding: '20px',
               borderRadius: '20px',
               transform: `scale(${spring({ frame: scene2Frame - 60, fps })})`
            }}>
               "Cocok buat manuver gila & budget mepet!" 🤣
            </div>
         </AbsoluteFill>
      </Sequence>

      {/* Scene 3: Jet 2 Mesin */}
      <Sequence from={210} durationInFrames={120}>
         <AbsoluteFill style={{ alignItems: 'center' }}>
            <div style={{
              marginTop: '100px',
              fontSize: '60px',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '3px 3px 0px #000',
              textAlign: 'center',
              opacity: interpolate(scene3Frame, [0, 15], [0, 1])
            }}>
              Jet 2 Mesin (F-22, Su-35) <br/> 💪 Si Kuli Udara! 💥
            </div>
            <div style={{
              position: 'absolute',
              fontSize: '300px',
              left: jet2X - 150,
              top: height / 2 - 150,
              transform: 'scaleX(-1) rotate(10deg)'
            }}>
              🦅
            </div>
            <div style={{
               position: 'absolute',
               left: jet2X - 50,
               top: height / 2 + 50,
               fontSize: '100px',
               transform: `scale(${muscleScale})`
            }}>
               💪💣
            </div>
            <div style={{
               position: 'absolute',
               bottom: '150px',
               fontSize: '40px',
               fontWeight: 'bold',
               backgroundColor: 'white',
               padding: '20px',
               borderRadius: '20px',
               transform: `scale(${spring({ frame: scene3Frame - 60, fps })})`
            }}>
               "Bawa rudal seabrek & aman walau 1 mesin mati!" 🛡️
            </div>
         </AbsoluteFill>
      </Sequence>

      {/* Scene 4: Kesimpulan */}
      <Sequence from={330}>
         <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFD700' }}>
            <div style={{
              transform: `scale(${outScale})`,
              fontSize: '55px',
              fontWeight: 'bold',
              color: '#000',
              textAlign: 'center',
              backgroundColor: 'white',
              padding: '50px',
              borderRadius: '40px',
              boxShadow: '10px 10px 0px #000'
            }}>
              🎖️ KESIMPULAN 🎖️ <br/><br/>
              1 Mesin = Murah, Ringan, Lincah 🤸‍♂️<br/>
              2 Mesin = Mahal, Bertenaga, Aman 🛡️<br/><br/>
              Semua tergantung dompet negara! 💰🇮🇩
            </div>
         </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
