export interface Boulder {
  id: string;
  name: string;
  description: string | null;
  grade: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  sector_id?: string;
  quality: number | null;
  type: string | null;
  image: string | null;
  image_line: string | null;
  latitude: number | null;
  longitude: number | null;
  height: string | null;
  style: string | string[] | null;
  top: boolean | null;
}
