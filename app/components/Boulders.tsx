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
  const [isCreating, setIsCreating] = useState(false);

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
    setIsCreating(false);
  }

  function handleCancelEdit() {
    setEditingBoulderId(null);
    setIsCreating(false);
  }

  function handleCreate() {
    setEditingBoulderId(null);
    setIsCreating(true);
  }

  async function handleCreateSubmit(newBoulder: Omit<Boulder, "id">) {
    try {
      const { error } = await supabase.from("boulder").insert([newBoulder]);

      if (error) throw error;
      fetchBoulders();
      setIsCreating(false);
    } catch (error) {
      console.error("Error creating boulder:", error);
    }
  }

  async function handleUpdate(updatedBoulder: Boulder | Omit<Boulder, "id">) {
    try {
      // Check if updatedBoulder has an id (meaning it's a Boulder, not a new one)
      if ("id" in updatedBoulder) {
        const { error } = await supabase
          .from("boulder")
          .update(updatedBoulder)
          .eq("id", updatedBoulder.id);

        if (error) throw error;
      } else {
        // Should never happen as this function is for updates, not creations
        console.error("Attempted to update a boulder without an ID");
        return;
      }

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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Bloques de Escalada</h1>
        <button
          onClick={handleCreate}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Nuevo Bloque
        </button>
      </div>

      {isCreating && (
        <div className="mb-8 p-4 border rounded bg-gray-50">
          <h2 className="text-xl font-semibold mb-4 text-black">
            Crear Nuevo Bloque
          </h2>
          <BoulderForm
            onSubmit={handleCreateSubmit}
            onCancel={handleCancelEdit}
          />
        </div>
      )}

      {boulders.length === 0 && !isCreating ? (
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
