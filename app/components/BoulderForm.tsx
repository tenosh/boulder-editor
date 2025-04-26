import { useState, useRef, ChangeEvent, FormEvent } from "react";
import Image from "next/image";
import { Boulder } from "@/app/types/boulder";

interface BoulderFormProps {
  boulder?: Boulder;
  onSubmit: (updatedBoulder: Boulder | Omit<Boulder, "id">) => void;
  onCancel: () => void;
}

// Style options for the multi-select dropdown
const STYLE_OPTIONS = [
  { value: "Flat approach", label: "Aproximación plana" },
  { value: "Uphill approach", label: "Aproximación en subida" },
  {
    value: "Steep uphill approach",
    label: "Aproximación en subida pronunciada",
  },
  { value: "Downhill approach", label: "Aproximación en bajada" },
  { value: "Morning sun", label: "Sol de mañana" },
  { value: "Afternoon sun", label: "Sol de tarde" },
  {
    value: "Tree-filtered sun (am)",
    label: "Sol filtrado por árboles (mañana)",
  },
  {
    value: "Tree-filtered sun (pm)",
    label: "Sol filtrado por árboles (tarde)",
  },
  { value: "Sunny most of the day", label: "Soleado la mayor parte del día" },
  { value: "Shady most of the day", label: "Sombreado la mayor parte del día" },
  { value: "Boulders dry fast", label: "Los bloques se secan rápido" },
  {
    value: "Boulders dry in rain",
    label: "Los bloques se escalan bajo la lluvia",
  },
  { value: "Start seated", label: "Inicio sentado" },
  { value: '"Highball", dangerous', label: '"Highball", peligroso' },
  { value: "Slabby problem", label: "Problema de Slab" },
  { value: "Very steep problem", label: "Problema muy desplomado" },
  { value: "Reachy, best if tall", label: "Morfo, mejor si eres alto" },
  { value: "Dynamic", label: "Dinámico" },
  { value: "Pumpy or sustained", label: "Bombeador o sostenido" },
  { value: "Technical", label: "Técnico" },
  { value: "Powerful", label: "Potente" },
  { value: "Pockets", label: "Pockets" },
  { value: "Small edges, crimpy", label: "Regletas, crimpy" },
  { value: "Slopey holds", label: "Agarres de Sloper" },
];

// Default empty boulder data for new creation
const DEFAULT_BOULDER: Omit<Boulder, "id"> = {
  name: "",
  description: null,
  grade: null,
  sector_id: "5f08920b-ff8b-45ed-b3f8-a4976bdd71b7", // Fixed sector ID
  quality: null,
  type: "boulder",
  image: null,
  image_line: null,
  latitude: null,
  longitude: null,
  height: null,
  style: [],
  top: null,
};

export default function BoulderForm({
  boulder,
  onSubmit,
  onCancel,
}: BoulderFormProps) {
  // Check if we're creating a new boulder
  const isCreating = !boulder;

  // Parse the style if it's a string
  const initialStyle = boulder?.style
    ? typeof boulder.style === "string"
      ? JSON.parse(boulder.style)
      : boulder.style
    : [];

  const [formData, setFormData] = useState({
    ...(boulder || DEFAULT_BOULDER),
    style: initialStyle,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(
    boulder?.image || null
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === "checkbox") {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleStyleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(
      (option) => option.value
    );
    setFormData({
      ...formData,
      style: selectedOptions,
    });
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log("file", file);
      setImageFile(file);

      // Check if the file is a HEIC image
      if (
        file.type === "image/heic" ||
        file.name.toLowerCase().endsWith(".heic")
      ) {
        // For HEIC files, don't show preview but let user know it's selected
        setImagePreview(null); // Clear any existing preview
        // We'll handle the notification in the UI below
      } else {
        // Regular image handling for non-HEIC files
        const reader = new FileReader();
        reader.onloadend = () => {
          console.log("reader.result", reader.result);
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return formData.image;

    setUploading(true);

    try {
      const isHeic =
        imageFile.type === "image/heic" ||
        imageFile.name.toLowerCase().endsWith(".heic");

      // For HEIC files, you may want to use a client-side conversion
      // library like heic2any
      let fileToProcess = imageFile;
      let imageData: string;

      if (isHeic) {
        try {
          // This assumes you've installed heic2any
          // npm install heic2any
          const heic2any = (await import("heic2any")).default;
          const jpegBlob = await heic2any({
            blob: imageFile,
            toType: "image/jpeg",
            quality: 1,
          });

          fileToProcess = new File(
            [jpegBlob instanceof Blob ? jpegBlob : jpegBlob[0]],
            "converted.jpg",
            { type: "image/jpeg" }
          );
        } catch (error) {
          console.error("Error converting HEIC:", error);
          throw new Error(
            "Failed to convert HEIC image. Please try a different format."
          );
        }
      }

      // Read the file as data URL
      const reader = new FileReader();
      return new Promise<string | null>((resolve, reject) => {
        reader.onloadend = async () => {
          try {
            // Get the image data as base64
            imageData = reader.result as string;

            // Send to API endpoint
            const response = await fetch("/api/boulders", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                imageData,
                routeId: "id" in formData ? formData.id : "new",
                imageFormat: fileToProcess.type,
              }),
            });

            const result = await response.json();

            if (result.success) {
              resolve(result.url);
            } else {
              reject(new Error(result.error || "Failed to upload image"));
            }
          } catch (error) {
            reject(error);
          }
        };

        reader.onerror = (error) => {
          reject(new Error("Error reading image file"));
        };

        // Read the (potentially converted) image file as data URL
        reader.readAsDataURL(fileToProcess);
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (uploading) return;

    // Upload image if there's a new one
    let imageUrl = formData.image;
    if (imageFile) {
      imageUrl = await uploadImage();
    }

    // Prepare final data for submission
    const updatedBoulder = {
      ...formData,
      image: imageUrl,
      // Convert style array to JSON string (if it's not already a string)
      style: JSON.stringify(formData.style),
    };

    onSubmit(updatedBoulder);
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4 text-black">
          {isCreating ? "Crear Nuevo Bloque" : "Editar Bloque"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name field */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-600"
            >
              Nombre
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-600"
              required
            />
          </div>

          {/* Hidden sector_id field */}
          <input
            type="hidden"
            name="sector_id"
            value={formData.sector_id || "5f08920b-ff8b-45ed-b3f8-a4976bdd71b7"}
          />

          {/* Description field */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-600"
            >
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-600"
            />
          </div>

          {/* Grade field */}
          <div>
            <label
              htmlFor="grade"
              className="block text-sm font-medium text-gray-600"
            >
              Grado
            </label>
            <input
              type="text"
              id="grade"
              name="grade"
              value={formData.grade || ""}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-600"
            />
          </div>

          {/* Type field (read-only) */}
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-gray-600"
            >
              Tipo (Boulder)
            </label>
            <input
              type="text"
              id="type"
              name="type"
              value={formData.type || "boulder"}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-600"
              readOnly
            />
          </div>

          {/* Height field */}
          <div>
            <label
              htmlFor="height"
              className="block text-sm font-medium text-gray-600"
            >
              Altura
            </label>
            <select
              id="height"
              name="height"
              value={formData.height || ""}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-600"
            >
              <option value="">Seleccionar altura</option>
              <option value="lowball">Bajo (Lowball)</option>
              <option value="regular">Regular</option>
              <option value="highball">Alto (Highball)</option>
            </select>
          </div>

          {/* Quality field */}
          <div>
            <label
              htmlFor="quality"
              className="block text-sm font-medium text-gray-600"
            >
              Calidad: {formData.quality || 0}
            </label>
            <input
              type="range"
              id="quality"
              name="quality"
              min="0"
              max="100"
              value={formData.quality || 0}
              onChange={handleChange}
              className="mt-1 block w-full"
            />
          </div>

          {/* Top field */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="top"
              name="top"
              checked={!!formData.top}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="top" className="ml-2 block text-sm text-gray-600">
              Top (¿Top 50?)
            </label>
          </div>

          {/* Style multi-select */}
          <div>
            <label
              htmlFor="style"
              className="block text-sm font-medium text-gray-600"
            >
              Estilo (selección múltiple)
            </label>
            <select
              id="style"
              name="style"
              multiple
              value={formData.style as string[]}
              onChange={handleStyleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-600"
              size={6}
            >
              {STYLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-600 mt-1">
              Mantén presionado Ctrl (Cmd en Mac) para seleccionar múltiples
              estilos
            </p>
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="latitude"
                className="block text-sm font-medium text-gray-600"
              >
                Latitud
              </label>
              <input
                type="number"
                step="0.000001"
                id="latitude"
                name="latitude"
                value={formData.latitude || ""}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-600"
              />
            </div>
            <div>
              <label
                htmlFor="longitude"
                className="block text-sm font-medium text-gray-600"
              >
                Longitud
              </label>
              <input
                type="number"
                step="0.000001"
                id="longitude"
                name="longitude"
                value={formData.longitude || ""}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-600"
              />
            </div>
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Imagen
            </label>

            {/* Image preview */}
            {imagePreview ? (
              <div className="mt-2 relative h-48 w-full rounded-md overflow-hidden">
                <div
                  className="cursor-pointer"
                  onClick={() =>
                    imagePreview && window.open(imagePreview, "_blank")
                  }
                  title="Abrir imagen en nueva pestaña"
                >
                  <Image
                    src={imagePreview}
                    alt="Vista previa"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            ) : imageFile ? (
              <div className="mt-2 p-4 border border-gray-300 rounded-md bg-gray-50">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">
                    Nueva imagen seleccionada:
                  </span>{" "}
                  {imageFile.name}
                </p>
                {(imageFile.type === "image/heic" ||
                  imageFile.name.toLowerCase().endsWith(".heic")) && (
                  <p className="text-xs text-gray-500 mt-1">
                    La vista previa no está disponible para imágenes HEIC. La
                    imagen será procesada y optimizada al guardar.
                  </p>
                )}
              </div>
            ) : null}

            <div className="mt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5 text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Seleccionar imagen
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            {boulder?.image_line && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  Imagen con línea disponible. Esta no se puede actualizar desde
                  aquí.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
              disabled={uploading}
            >
              {uploading
                ? "Guardando..."
                : isCreating
                ? "Crear"
                : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
