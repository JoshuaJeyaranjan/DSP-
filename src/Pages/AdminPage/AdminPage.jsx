// AdminPage.jsx
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import './AdminPage.scss';

// Env variables
const PROJECT_URL = import.meta.env.VITE_PROJECT_URL;
const ANON_KEY = import.meta.env.VITE_ANON_KEY;
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

// Node.js thumbnail service URL
const SERVICE_URL = import.meta.env.VITE_NODE_THUMBNAIL_SERVICE_URL;

// Create Supabase client
const supabase = createClient(PROJECT_URL, ANON_KEY);

const CATEGORIES = ['car', 'sports', 'drone', 'portrait', 'product'];

const AdminPage = () => {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [uploading, setUploading] = useState(false);
  const [derivedImages, setDerivedImages] = useState([]);
  const [error, setError] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // ------------------------
  // Authenticate admin
  // ------------------------
  useEffect(() => {
    const loginAdmin = async () => {
      setLoadingAuth(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });
      if (error) {
        console.error('Admin login failed:', error);
        setError('Admin login failed. Check env variables.');
      } else {
        console.log('✅ Admin logged in:', data.session);
      }

      setLoadingAuth(false);
    };

    loginAdmin();
  }, []);

  // ------------------------
  // Handle file selection
  // ------------------------
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setDerivedImages([]);
    setError(null);
  };

  // ------------------------
  // Handle file upload
  // ------------------------
  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      // Step 1: Upload original image to Supabase
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('photos-original')
        .upload(file.name, file, { upsert: true });

      if (uploadError) throw uploadError;
      console.log('✅ Uploaded original:', uploadData);

      // Step 2: Call Node.js thumbnail service
      const resp = await fetch(`${SERVICE_URL}/generate-thumbnails`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // ✅ Pass along auth header if you lock down your Node service
          Authorization: `Bearer ${supabase.auth.session()?.access_token || ''}`,
        },
        body: JSON.stringify({
          bucket: 'photos-original',
          file: file.name,
          category,  // ✅ Send selected category
        }),
      });

      const result = await resp.json();
      if (!resp.ok || !result.ok) throw new Error(result.error || 'Thumbnail generation failed');

      // Step 3: Get public URLs for derived images
      const urls = result.generated.map((g) => {
        return supabase.storage.from('photos-derived').getPublicUrl(g.path).data.publicUrl;
      });

      setDerivedImages(urls);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loadingAuth) return <p>Logging in as admin...</p>;

  return (
    <div className="admin-page">
      <h1>Admin Dashboard</h1>
      {error && <p className="error">{error}</p>}

      {/* File input */}
      <input type="file" onChange={handleFileChange} />

      {/* Category selector */}
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </option>
        ))}
      </select>

      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? 'Uploading...' : 'Upload'}
      </button>

      <div className="derived-images">
        {derivedImages.map((url, idx) => (
          <img key={idx} src={url} alt={`Derived ${idx}`} />
        ))}
      </div>
    </div>
  );
};

export default AdminPage;
