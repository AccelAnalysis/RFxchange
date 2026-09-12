"use client";
import { useState } from "react";
import Link from "next/link";
import { findPublicHelp, PUBLIC_HELP_ARTICLES, type PublicHelpArticle } from "@/src/application/support/public-help";
import styles from "@/src/components/communications/ServiceSettings.module.css";
export function PublicHelp({ articles = PUBLIC_HELP_ARTICLES }: { articles?: readonly PublicHelpArticle[] }) {
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState<readonly PublicHelpArticle[] | null>(null);
  return <section className={styles.panel}>
    <h1>How can we help?</h1><p>Find answers about joining RFxchange and using the Exchange.</p>
    <form onSubmit={event => { event.preventDefault(); setAnswers(findPublicHelp(question, articles)); }}>
      <label htmlFor="help-question">Your question</label><input id="help-question" maxLength={500} required value={question} onChange={e => setQuestion(e.target.value)}/><button type="submit">Find an answer</button>
    </form>
    <div aria-live="polite">{answers && (answers.length ? answers.map(article => <article key={article.id}><h2>{article.title}</h2><p>{article.answer}</p><Link href={article.path}>Read more</Link></article>) : <p>I don’t have an answer to that in the help guide. Try a question about joining, access, capabilities or membership.</p>)}</div>
    <h2>Common questions</h2>{articles.map(article => <details key={article.id}><summary>{article.title}</summary><p>{article.answer}</p><Link href={article.path}>Read more</Link></details>)}
  </section>;
}
