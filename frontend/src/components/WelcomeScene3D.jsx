export default function WelcomeScene3D() {
  return (
    <div className="relative h-full w-full overflow-hidden flex items-center justify-center">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#111827] to-[#0a0a0a] opacity-90" />
      
      {/* Subtle grid overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />
      
      {/* Radial glow in center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className="w-[500px] h-[500px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(0, 168, 132, 0.3) 0%, transparent 70%)'
          }}
        />
      </div>
    </div>
  );
}
