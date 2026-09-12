"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/src/components/i18n/I18nProvider";
import { PUBLIC_HELP_PATHS, type PublicHelpArticle } from "@/src/application/support/public-help";
import styles from "./ServiceSettings.module.css";
export function AdminPublicHelpSettings() {
  const { dictionary, t } = useI18n();
  const { common, admin: copy, help } = dictionary.interface.services;
  const [articles, setArticles] = useState<PublicHelpArticle[]>([]);
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);
  const [version, setVersion] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [confirmPublic, setConfirmPublic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/public-help", { signal: controller.signal }).then(async response => {
      const data = await response.json(); if (!response.ok) throw new Error(response.status === 409 ? common.conflict : response.status === 401 || response.status === 403 ? common.denied : common.saveError);
      setArticles(data.articles); setVersion(data.version);
    }).catch(() => { if (!controller.signal.aborted) setMessage(common.loadError); });
    return () => controller.abort();
  }, [common]);
  const update = (index: number, patch: Partial<PublicHelpArticle>) => setArticles(previous => previous.map((article, i) => i === index ? { ...article, ...patch } : article));
  return <section className={styles.panel}><Link href="/admin/communications/lifecycle">{copy.lifecycle}</Link><h1>{copy.helpTitle}</h1>
    <p>{copy.helpIntro}</p>
    {version === null && !message ? <p role="status">{common.loading}</p> : null}
    <form onSubmit={async event => {
      event.preventDefault(); setBusy(true); setMessage("");
      try {
        const response = await fetch("/api/admin/public-help", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ articles, expectedVersion: version, reason, confirmPublic }) });
        const data = await response.json(); if (!response.ok) throw new Error(response.status === 409 ? common.conflict : response.status === 401 || response.status === 403 ? common.denied : common.saveError);
        setArticles(data.articles); setVersion(data.version); setReason(""); setConfirmPublic(false); setMessage(copy.published);
      } catch (error) { setMessage(error instanceof Error && !(error instanceof TypeError) ? error.message : common.saveError); } finally { setBusy(false); }
    }}><fieldset disabled={version === null || busy}><legend>{copy.answers}</legend>
      {articles.map((article, index) => <details className={styles.answer} key={article.id} open={expandedArticleId === article.id}
        onToggle={event => {
          const open = event.currentTarget.open;
          setExpandedArticleId(current => open ? article.id : current === article.id ? null : current);
        }}
        onInvalidCapture={event => { event.currentTarget.open = true; setExpandedArticleId(article.id); }}>
        <summary>{article.title || t("interface.services.admin.answerNumber", { number: index + 1 })}</summary>
        <label>{copy.question}<input required maxLength={160} value={article.title} onChange={event => update(index, { title: event.target.value })}/></label>
        <label>{copy.answer}<textarea required maxLength={4000} value={article.answer} onChange={event => update(index, { answer: event.target.value })}/></label>
        <label>{copy.keywords}<input required value={article.keywords.join(" ")} onChange={event => update(index, { keywords: event.target.value.toLowerCase().split(" ") })}/></label>
        <label>{help.readMore}<select value={article.path} onChange={event => update(index, { path: event.target.value })}>{PUBLIC_HELP_PATHS.map(path => <option key={path}>{path}</option>)}</select></label>
        <button className={styles.secondary} type="button" disabled={articles.length <= 1} onClick={() => setArticles(articles.filter((_, i) => i !== index))}>{copy.remove}</button>
      </details>)}
      <button className={styles.secondary} type="button" disabled={articles.length >= 30} onClick={() => {
        const id = `help-${crypto.randomUUID()}`;
        setArticles([...articles, { id, title: "", answer: "", path: "/how-it-works", keywords: ["help"] }]);
        setExpandedArticleId(id);
      }}>{copy.add}</button>
      <label>{copy.publicationReason}<textarea required maxLength={1000} value={reason} onChange={event => setReason(event.target.value)}/></label>
      <label><input required type="checkbox" checked={confirmPublic} onChange={event => setConfirmPublic(event.target.checked)}/> {copy.confirmPublic}</label>
    </fieldset><button disabled={version === null || busy}>{busy ? common.saving : copy.publish}</button><p role="status">{message}</p></form></section>;
}
