import Image from "next/image";
import { Boulder } from "@/app/types/boulder";

interface BoulderCardProps {
  boulder: Boulder;
  onEdit: () => void;
}

export default function BoulderCard({ boulder, onEdit }: BoulderCardProps) {
  // Format style items for display
  const styleItems = boulder.style
    ? JSON.parse(
        typeof boulder.style === "string"
          ? boulder.style
          : JSON.stringify(boulder.style)
      )
    : [];

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="relative h-64">
        {boulder.image ? (
          <div
            className="cursor-pointer"
            onClick={() =>
              boulder.image && window.open(boulder.image, "_blank")
            }
          >
            <Image
              src={boulder.image}
              alt={boulder.name}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100 text-gray-600">
            No hay imagen para esta línea
          </div>
        )}
        {boulder.image_line && (
          <div className="absolute top-0 right-0 p-2">
            <button
              className="bg-white p-1 rounded-full shadow-md"
              onClick={() =>
                boulder.image_line && window.open(boulder.image_line, "_blank")
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h2 className="text-xl font-bold text-gray-600">{boulder.name}</h2>
          <span className="text-sm font-semibold bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
            {boulder.grade || "Sin grado"}
          </span>
        </div>

        <p className="text-gray-600 mb-3">
          {boulder.description || "Sin descripción"}
        </p>

        <div className="grid grid-cols-2 gap-2 mb-3 text-sm text-gray-600">
          <div>
            <span className="font-semibold">Tipo:</span>{" "}
            {boulder.type || "No especificado"}
          </div>
          <div>
            <span className="font-semibold">Altura:</span>{" "}
            {translateHeight(boulder.height) || "No especificada"}
          </div>
          <div>
            <span className="font-semibold">Calidad:</span>{" "}
            {boulder.quality || "0"}/100
          </div>
          <div>
            <span className="font-semibold">Top:</span>{" "}
            {boulder.top ? "Sí" : "No"}
          </div>
        </div>

        {styleItems.length > 0 && (
          <div className="mb-3">
            <h3 className="font-semibold mb-1 text-gray-600">Estilo:</h3>
            <div className="flex flex-wrap gap-1">
              {styleItems.map((style: string, index: number) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                >
                  {translateStyle(style)}
                </span>
              ))}
            </div>
          </div>
        )}

        {boulder.latitude && boulder.longitude && (
          <div className="mb-3">
            <h3 className="font-semibold mb-1 text-gray-600">Ubicación:</h3>
            <a
              href={`https://maps.google.com/?q=${boulder.latitude},${boulder.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              Ver en Google Maps
            </a>
          </div>
        )}

        <button
          onClick={onEdit}
          className="w-full mt-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Editar
        </button>
      </div>
    </div>
  );
}

// Helper functions for translations
function translateHeight(height: string | null): string {
  if (!height) return "";

  const heightMap: Record<string, string> = {
    lowball: "Lowball",
    regular: "Regular",
    highball: "Highball",
  };

  return heightMap[height] || height;
}

function translateStyle(style: string): string {
  const styleMap: Record<string, string> = {
    "Flat approach": "Aproximación plana",
    "Uphill approach": "Aproximación en subida",
    "Steep uphill approach": "Aproximación en subida pronunciada",
    "Downhill approach": "Aproximación en bajada",
    "Morning sun": "Sol de mañana",
    "Afternoon sun": "Sol de tarde",
    "Tree-filtered sun (am)": "Sol filtrado por árboles (mañana)",
    "Tree-filtered sun (pm)": "Sol filtrado por árboles (tarde)",
    "Sunny most of the day": "Soleado la mayor parte del día",
    "Shady most of the day": "Sombreado la mayor parte del día",
    "Boulders dry fast": "Los bloques se secan rápido",
    "Boulders dry in rain": "Los bloques se escalan bajo la lluvia",
    "Start seated": "Inicio sentado",
    '"Highball", dangerous': '"Highball", peligroso',
    "Slabby problem": "Problema de Slab",
    "Very steep problem": "Problema muy desplomado",
    "Reachy, best if tall": "Morfo, mejor si eres alto",
    Dynamic: "Dinámico",
    "Pumpy or sustained": "Bombeador o sostenido",
    Technical: "Técnico",
    Powerful: "Potente",
    Pockets: "Pockets",
    "Small edges, crimpy": "Regletas, crimpy",
    "Slopey holds": "Agarres de Sloper",
  };

  return styleMap[style] || style;
}
