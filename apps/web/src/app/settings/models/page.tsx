'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import {
  listScoringProfiles,
  createScoringProfile,
  updateScoringProfile,
  deleteScoringProfile,
  type ScoringProfileDTO,
} from '@/lib/api';
import { DEFAULT_WEIGHT_PRESETS } from '@anti-detect/consistency';
import type { ScoringWeights } from '@anti-detect/consistency';

const DEFAULT_WEIGHTS: ScoringWeights = {
  network: 0.2,
  navigator: 0.15,
  graphics: 0.2,
  audio: 0.1,
  fonts: 0.1,
  locale: 0.1,
  automation: 0.15,
};

const weightKeys: Array<keyof ScoringWeights> = [
  'network',
  'navigator',
  'graphics',
  'audio',
  'fonts',
  'locale',
  'automation',
];

export default function ModelsSettingsPage() {
  const [profiles, setProfiles] = useState<ScoringProfileDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    useCase: '',
    weights: { ...DEFAULT_WEIGHTS },
    isDefault: false,
  });

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: '',
      slug: '',
      description: '',
      useCase: '',
      weights: { ...DEFAULT_WEIGHTS },
      isDefault: false,
    });
  };

  const refreshProfiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listScoringProfiles();
      setProfiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfiles();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      if (editingId) {
        await updateScoringProfile(editingId, form);
        setSuccess('Profile updated');
      } else {
        await createScoringProfile(form);
        setSuccess('Profile created');
      }
      resetForm();
      await refreshProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile');
    }
  };

  const handleEdit = (profile: ScoringProfileDTO) => {
    setEditingId(profile.id);
    setForm({
      name: profile.name,
      slug: profile.slug,
      description: profile.description || '',
      useCase: profile.useCase || '',
      weights: { ...profile.weights },
      isDefault: profile.isDefault,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (profile: ScoringProfileDTO) => {
    if (!window.confirm(`Delete ${profile.name}?`)) return;
    setError(null);
    try {
      await deleteScoringProfile(profile.id);
      await refreshProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete profile');
    }
  };

  const handleWeightChange = (key: keyof ScoringWeights, value: string) => {
    const numeric = Number(value);
    setForm((prev) => ({
      ...prev,
      weights: {
        ...prev.weights,
        [key]: Number.isFinite(numeric) ? numeric : prev.weights[key],
      },
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <Header />
      <main className="flex-1 py-12 px-4">
        <div className="max-w-5xl mx-auto space-y-10">
          <div>
            <p className="text-xs uppercase tracking-wide text-text-muted">Settings</p>
            <h1 className="text-3xl font-bold text-text-primary">Risk Model Profiles</h1>
            <p className="text-text-secondary max-w-2xl">
              Tune how each detection layer influences the trust score. Built-in presets stay read-only;
              create custom blends for vertical-specific risk policies.
            </p>
          </div>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DEFAULT_WEIGHT_PRESETS.map((preset) => (
              <div key={preset.id} className="p-4 rounded-lg border border-border bg-bg-secondary">
                <p className="text-xs uppercase tracking-wide text-text-muted">Built-in</p>
                <h3 className="text-lg font-semibold text-text-primary">{preset.name}</h3>
                <p className="text-sm text-text-secondary mb-3">{preset.description}</p>
                <div className="flex flex-wrap gap-2 text-xs text-text-muted">
                  {Object.entries(preset.weights).map(([layer, weight]) => (
                    <span key={layer} className="px-2 py-1 rounded-full bg-bg-primary border border-border/60">
                      {layer}: {(weight * 100).toFixed(0)}%
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <section className="p-6 rounded-lg border border-border bg-bg-secondary">
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              {editingId ? 'Edit Profile' : 'Create New Profile'}
            </h2>
            {error && <p className="text-sm text-error mb-2">{error}</p>}
            {success && <p className="text-sm text-success mb-2">{success}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-text-muted">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full mt-1 rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-text-muted">Slug</label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="Optional, auto-generated"
                    className="w-full mt-1 rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-text-muted">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full mt-1 rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm text-text-muted">Use Case</label>
                <input
                  type="text"
                  value={form.useCase}
                  onChange={(e) => setForm((prev) => ({ ...prev, useCase: e.target.value }))}
                  className="w-full mt-1 rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {weightKeys.map((key) => (
                  <div key={key}>
                    <label className="text-xs uppercase tracking-wide text-text-muted">{key}</label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.05"
                      value={form.weights[key]}
                      onChange={(e) => handleWeightChange(key, e.target.value)}
                      className="w-full mt-1 rounded-md border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                      required
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={form.isDefault}
                  onChange={(e) => setForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                  className="rounded border-border text-accent focus:ring-accent"
                />
                <label htmlFor="isDefault" className="text-sm text-text-secondary">
                  Make default preset
                </label>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-accent text-bg-primary font-semibold rounded-md hover:bg-accent/90 disabled:opacity-60"
                >
                  {editingId ? 'Update Profile' : 'Create Profile'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-5 py-2 border border-border text-text-secondary rounded-md hover:text-text-primary"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="p-6 rounded-lg border border-border bg-bg-secondary">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-text-primary">Custom Profiles</h2>
              <button
                onClick={refreshProfiles}
                className="text-sm text-accent hover:underline"
                disabled={loading}
              >
                Refresh
              </button>
            </div>
            {profiles.length === 0 ? (
              <p className="text-text-muted text-sm">No custom profiles yet.</p>
            ) : (
              <div className="space-y-3">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="p-4 rounded-lg border border-border/70 bg-bg-primary flex flex-col gap-2"
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-text-muted">{profile.slug}</p>
                        <h3 className="text-lg font-semibold text-text-primary">{profile.name}</h3>
                        <p className="text-sm text-text-secondary">{profile.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(profile)}
                          className="px-3 py-1 text-xs text-text-secondary border border-border rounded-md hover:text-text-primary"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(profile)}
                          className="px-3 py-1 text-xs text-error border border-error/40 rounded-md hover:bg-error/10"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-text-muted">
                      {Object.entries(profile.weights).map(([layer, weight]) => (
                        <span key={layer} className="px-2 py-1 rounded-full bg-bg-secondary border border-border/60">
                          {layer}: {(Number(weight) * 100).toFixed(0)}%
                        </span>
                      ))}
                    </div>
                    {profile.useCase && (
                      <p className="text-xs text-text-muted">Use Case: {profile.useCase}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
