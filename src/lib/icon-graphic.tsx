// アプリアイコンの共通デザイン(Next.js の ImageResponse から利用)。
// ポケモン公式のモンスターボールデザインの複製を避け、
// 「睡眠 x 分析」をテーマにしたオリジナルの月+グラフのモチーフにしている。
export function iconGraphic(size: number) {
  const moonSize = size * 0.62;
  const cutoutOffset = size * 0.16;

  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #3a2f78 0%, #201a3d 100%)',
        borderRadius: size * 0.22,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: moonSize,
          height: moonSize,
          display: 'flex',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: moonSize,
            height: moonSize,
            borderRadius: '50%',
            background: '#f5b942',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: moonSize,
            height: moonSize,
            borderRadius: '50%',
            background: '#3a2f78',
            top: -cutoutOffset * 0.15,
            left: cutoutOffset,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: size * 0.07,
            height: size * 0.07,
            borderRadius: '50%',
            background: '#ffffff',
            top: size * 0.06,
            right: -size * 0.02,
            opacity: 0.9,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: size * 0.045,
            height: size * 0.045,
            borderRadius: '50%',
            background: '#ffffff',
            bottom: size * 0.1,
            right: size * 0.1,
            opacity: 0.7,
          }}
        />
      </div>
    </div>
  );
}
