"use client";

import { FormEvent, useEffect, useState } from "react";
import s from "@/app/(app)/dashboard.module.css";
import { ApiError, api } from "@/lib/api";
import type { Pet, PetType } from "@/lib/types";

export default function PetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [petTypes, setPetTypes] = useState<PetType[]>([]);
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [petTypeId, setPetTypeId] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function load() {
    api.pets().then(setPets).catch((e) => setErr(asMsg(e)));
  }
  useEffect(() => {
    api.petTypes().then((pts) => {
      setPetTypes(pts);
      if (pts[0]) setPetTypeId(pts[0].id);
    });
    load();
  }, []);

  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    try {
      await api.createPet({
        name,
        pet_type_id: petTypeId,
        breed: breed || null,
        age_years: age ? Number(age) : null,
      });
      setName("");
      setBreed("");
      setAge("");
      load();
    } catch (e) {
      setErr(asMsg(e));
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this pet?")) return;
    await api.deletePet(id);
    load();
  }

  return (
    <>
      <div className={s.mainTop}>
        <div>
          <div className={s.wTitle}>My Pets</div>
          <div className={s.wSub}>Pets drive which guidance is surfaced for you</div>
        </div>
      </div>

      <form
        onSubmit={add}
        style={{
          background: "var(--card)",
          border: "0.5px solid var(--border2)",
          borderRadius: 12,
          padding: 14,
          marginBottom: 14,
          display: "grid",
          gridTemplateColumns: "2fr 2fr 1fr 1fr auto",
          gap: 8,
          alignItems: "end",
        }}
      >
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
        </Field>
        <Field label="Breed">
          <input value={breed} onChange={(e) => setBreed(e.target.value)} maxLength={80} />
        </Field>
        <Field label="Age (yr)">
          <input
            type="number"
            min={0}
            max={80}
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </Field>
        <Field label="Type">
          <select value={petTypeId} onChange={(e) => setPetTypeId(e.target.value)}>
            {petTypes.map((pt) => (
              <option key={pt.id} value={pt.id}>
                {pt.icon_emoji} {pt.name}
              </option>
            ))}
          </select>
        </Field>
        <button type="submit" style={btn}>
          Add
        </button>
      </form>

      {err && <div className="err" style={{ marginBottom: 12 }}>{err}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
        {pets.map((p) => (
          <div
            key={p.id}
            style={{
              background: "var(--card)",
              border: "0.5px solid var(--border2)",
              borderRadius: 12,
              padding: 14,
            }}
          >
            <div className={s.petIcon} style={{ background: p.pet_type.icon_bg, marginBottom: 8 }}>
              {p.pet_type.icon_emoji}
            </div>
            <div className={s.petName}>{p.name}</div>
            <div className={s.petType}>
              {p.pet_type.name}
              {p.breed ? ` · ${p.breed}` : ""}
              {p.age_years != null ? ` · ${p.age_years} yr` : ""}
            </div>
            <button
              onClick={() => remove(p.id)}
              style={{ marginTop: 10, fontSize: 11, color: "var(--red)" }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", fontSize: 11, color: "var(--t2)", gap: 3 }}>
      {label}
      {children}
    </label>
  );
}

const btn: React.CSSProperties = {
  padding: "8px 14px",
  background: "var(--black)",
  color: "var(--ivory)",
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 500,
};

function asMsg(e: unknown): string {
  return e instanceof ApiError ? e.message : "Failed";
}
