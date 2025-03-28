"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import BoulderCard from "./BoulderCard";
import BoulderForm from "./BoulderForm";
import { Boulder } from "@/app/types/boulder";

export default function Boulders() {
  const [boulders, setBoulders] = useState<Boulder[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBoulderId, setEditingBoulderId] = useState<string | null>(null);

  useEffect(() => {
    fetchBoulders();
  }, []);

  async function fetchBoulders() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("boulder")
        .select("*")
        .order("name");

      if (error) throw error;
      setBoulders(data || []);
    } catch (error) {
      console.error("Error fetching boulders:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(boulderId: string) {
    setEditingBoulderId(boulderId);
  }

  function handleCancelEdit() {
    setEditingBoulderId(null);
  }

  async function handleUpdate(updatedBoulder: Boulder) {
    try {
      const { error } = await supabase
        .from("boulder")
        .update(updatedBoulder)
        .eq("id", updatedBoulder.id);

      if (error) throw error;
      fetchBoulders();
      setEditingBoulderId(null);
    } catch (error) {
      console.error("Error updating boulder:", error);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Cargando bloques...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold mb-4">Bloques de Escalada</h1>

      {boulders.length === 0 ? (
        <p>No se encontraron bloques.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boulders.map((boulder) => (
            <div key={boulder.id}>
              {editingBoulderId === boulder.id ? (
                <BoulderForm
                  boulder={boulder}
                  onSubmit={handleUpdate}
                  onCancel={handleCancelEdit}
                />
              ) : (
                <BoulderCard
                  boulder={boulder}
                  onEdit={() => handleEdit(boulder.id)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
