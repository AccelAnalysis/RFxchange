"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/src/components/i18n/I18nProvider";
import { findPublicHelp, PUBLIC_HELP_ARTICLES, type PublicHelpArticle } from "@/src/application/support/public-help";
import { localizePublicHelpArticles } from "@/src/application/support/localize-public-help";
import styles from "@/src/components/communications/ServiceSettings.module.css";

export function PublicHelp({ articles = PUBLIC_HELP_ARTICLES }: { articles?: readonly PublicHelpArticle[] }) {
  const { dictionary } = useI18n();
  const copy = dictionary.interface.services.help;
  const [question, setQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState<string | null>(null);
  const localizedArticles = useMemo(() => localizePublicHelpArticles(articles, copy.articles), [articles, copy.articles]);
  const answers = submittedQuestion === null ? null : findPublicHelp(submittedQuestion, localizedArticles);
  return <section className={styles.panel}>
    <h1>{copy.title}</h1><p>{copy.intro}</p>
    <form className={styles.search} onSubmit={event => { event.preventDefault(); setSubmittedQuestion(question); }}>
      <label htmlFor="help-question">{copy.question}</label>
      <input id="help-question" maxLength={500} required value={question} onChange={event => setQuestion(event.target.value)}/>
      <button type="submit">{copy.search}</button>
    </form>
    <div className={styles.results} aria-live="polite">
      {answers && (answers.length ? <><h2>{copy.results}</h2>{answers.map(article => <article key={article.id}><h3>{article.title}</h3><p>{article.answer}</p><Link href={article.path}>{copy.readMore}</Link></article>)}</> : <p>{copy.empty}</p>)}
    </div>
    <h2>{copy.common}</h2>
    {localizedArticles.map(article => <details key={article.id}><summary>{article.title}</summary><p>{article.answer}</p><Link href={article.path}>{copy.readMore}</Link></details>)}
  </section>;
}
