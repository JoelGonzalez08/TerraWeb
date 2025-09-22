interface TerraLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export default function TerraLogo({ className = "", width = 24, height = 24 }: TerraLogoProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Aquí pegas el contenido de tu SVG */}
      {/* Ejemplo placeholder - reemplaza con tu SVG real */}
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" 
            stroke="currentColor" 
            strokeWidth="2" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round"/>
    </svg>
  );
}