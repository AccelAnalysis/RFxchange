"use client";
import { useEffect, useState } from "react";
import { PUBLIC_HELP_PATHS, type PublicHelpArticle } from "@/src/application/support/public-help";
import styles from "./ServiceSettings.module.css";
export function AdminPublicHelpSettings() {
  const [articles, setArticles] = useState<PublicHelpArticle[]>([]);
  const [version, setVersion] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [confirmPublic, setConfirmPublic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/public-help", { signal: controller.signal }).then(async response => {
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setArticles(data.articles); setVersion(data.version);
    }).catch(error => { if (!controller.signal.aborted) setMessage(error.message); });
    return () => controller.abort();
  }, []);
  const update = (index: number, patch: Partial<PublicHelpArticle>) => setArticles(previous => previous.map((article, i) => i === index ? { ...article, ...patch } : article));
  return <section className={styles.panel}><a href="/admin/communications/lifecycle">Lifecycle & support</a><h1>Public help guide</h1>
    <p>Publish approved answers for the public help assistant. Only these articles are searched; account records and support cases are excluded.</p>
    <form onSubmit={async event => {
      event.preventDefault(); setBusy(true); setMessage("");
      try {
        const response = await fetch("/api/admin/public-help", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ articles, expectedVersion: version, reason, confirmPublic }) });
        const data = await response.json(); if (!response.ok) throw new Error(data.error);
        setArticles(data.articles); setVersion(data.version); setReason(""); setConfirmPublic(false); setMessage("Public help published.");
      } catch (error) { setMessage(error instanceof Error ? error.message : "Help could not be published."); } finally { setBusy(false); }
    }}><fieldset disabled={version === null || busy}><legend>Public answers</legend>
      {articles.map((article, index) => <fieldset key={article.id}><legend>Answer {index + 1}</legend>
        <label>Question<input required maxLength={160} value={article.title} onChange={event => update(index, { title: event.target.value })}/></label>
        <label>Answer<textarea required maxLength={4000} value={article.answer} onChange={event => update(index, { answer: event.target.value })}/></label>
        <label>Search keywords<input required value={article.keywords.join(" ")} onChange={event => update(index, { keywords: event.target.value.toLowerCase().split(" ") })}/></label>
        <label>Read more<select value={article.path} onChange={event => update(index, { path: event.target.value })}>{PUBLIC_HELP_PATHS.map(path => <option key={path}>{path}</option>)}</select></label>
        <button type="button" disabled={articles.length <= 1} onClick={() => setArticles(articles.filter((_, i) => i !== index))}>Remove answer</button>
      </fieldset>)}
      <button type="button" disabled={articles.length >= 30} onClick={() => setArticles([...articles, { id: `help-${crypto.randomUUID()}`, title: "", answer: "", path: "/how-it-works", keywords: ["help"] }])}>Add answer</button>
      <label>Reason for publication<textarea required maxLength={1000} value={reason} onChange={event => setReason(event.target.value)}/></label>
      <label><input required type="checkbox" checked={confirmPublic} onChange={event => setConfirmPublic(event.target.checked)}/> These answers are approved for everyone to read and contain no private account or support information.</label>
    </fieldset><button disabled={version === null || busy}>Publish public help</button><p role="status">{message}</p></form></section>;
}
