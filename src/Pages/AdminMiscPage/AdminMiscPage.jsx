import React, { useEffect, useState } from "react";
import { supabase } from "../../utils/supabaseClient";
import "./AdminMiscPage.scss";
import Nav from "../../Components/Nav/Nav";
import Footer from "../../Components/Footer/Footer";

export default function AdminMiscPage() {
  const [paragraphs, setParagraphs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buttonStatus, setButtonStatus] = useState({});

  const triggerButtonStatus = (key, label = "Done", duration = 1500) => {
    setButtonStatus((prev) => ({ ...prev, [key]: label }));
    setTimeout(() => {
      setButtonStatus((prev) => ({ ...prev, [key]: null }));
    }, duration);
  };

  const loadParagraphs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("about")
        .select("*")
        .order("position", { ascending: true });
      if (error) throw error;
      setParagraphs(data || []);
    } catch (err) {
      console.error("Failed to load paragraphs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParagraphs();
  }, []);

  const updateParagraph = (id, newContent) => {
    setParagraphs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, content: newContent } : p)),
    );
  };

  const saveParagraph = async (id) => {
    triggerButtonStatus(`${id}-save`, "Saving...");
    try {
      const paragraph = paragraphs.find((p) => p.id === id);
      const { error } = await supabase
        .from("about")
        .update({ content: paragraph.content, updated_at: new Date() })
        .eq("id", id);
      if (error) throw error;
      triggerButtonStatus(`${id}-save`);
    } catch (err) {
      console.error("Failed to save paragraph:", err);
      triggerButtonStatus(`${id}-save`, "Error");
    }
  };

  const addParagraph = async () => {
    triggerButtonStatus("add", "Adding...");
    try {
      const position =
        paragraphs.length > 0
          ? Math.max(...paragraphs.map((p) => p.position)) + 1
          : 0;
      const { data, error } = await supabase
        .from("about")
        .insert([{ content: "New paragraph...", position }])
        .select();
      if (error) throw error;
      setParagraphs((prev) => [...prev, ...data]);
      triggerButtonStatus("add");
    } catch (err) {
      console.error("Failed to add paragraph:", err);
      triggerButtonStatus("add", "Error");
    }
  };

  const deleteParagraph = async (id) => {
    if (!window.confirm("Are you sure you want to delete this paragraph?"))
      return;
    triggerButtonStatus(`${id}-delete`, "Deleting...");
    try {
      const { error } = await supabase.from("about").delete().eq("id", id);
      if (error) throw error;
      setParagraphs((prev) => prev.filter((p) => p.id !== id));
      triggerButtonStatus(`${id}-delete`);
    } catch (err) {
      console.error("Failed to delete paragraph:", err);
      triggerButtonStatus(`${id}-delete`, "Error");
    }
  };

  const moveParagraph = (id, direction) => {
    triggerButtonStatus(
      `${id}-move`,
      direction === "up" ? "Moving ↑" : "Moving ↓",
    );
    setParagraphs((prev) => {
      const index = prev.findIndex((p) => p.id === id);
      if (index === -1) return prev;
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;

      const newArray = [...prev];
      [newArray[index], newArray[newIndex]] = [
        newArray[newIndex],
        newArray[index],
      ];

      return newArray.map((p, i) => ({ ...p, position: i }));
    });
    triggerButtonStatus(`${id}-move`);
  };

  const savePositions = async () => {
    triggerButtonStatus("save-order", "Saving...");
    try {
      await Promise.all(
        paragraphs.map((p) =>
          supabase
            .from("about")
            .update({ position: p.position, updated_at: new Date() })
            .eq("id", p.id),
        ),
      );
      triggerButtonStatus("save-order");
    } catch (err) {
      console.error("Failed to save positions:", err);
      triggerButtonStatus("save-order", "Error");
    }
  };

  return (
    <>
      <Nav />
      <div className="admin-misc-page">
        <h1>Admin Miscellaneous Media Dashboard</h1>

        <div className="about-editor">
          <h2>About Section Editor</h2>

          {loading && <p>Loading paragraphs...</p>}

          {paragraphs.map((p, idx) => (
            <div key={p.id} className="about-paragraph">
              <textarea
                value={p.content}
                onChange={(e) => updateParagraph(p.id, e.target.value)}
              />
              <div className="paragraph-actions">
                <button
                  onClick={() => moveParagraph(p.id, "up")}
                  disabled={idx === 0}
                >
                  {buttonStatus[`${p.id}-move`] || "↑"}
                </button>
                <button
                  onClick={() => moveParagraph(p.id, "down")}
                  disabled={idx === paragraphs.length - 1}
                >
                  {buttonStatus[`${p.id}-move`] || "↓"}
                </button>
                <button onClick={() => saveParagraph(p.id)}>
                  {buttonStatus[`${p.id}-save`] || "Save"}
                </button>
                <button onClick={() => deleteParagraph(p.id)}>
                  {buttonStatus[`${p.id}-delete`] || "Delete"}
                </button>
              </div>
            </div>
          ))}

          <button className="add-paragraph-btn" onClick={addParagraph}>
            {buttonStatus["add"] || "+ Add Paragraph"}
          </button>

          <button className="save-order-btn" onClick={savePositions}>
            {buttonStatus["save-order"] || "Save Paragraph Order"}
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
}
