import Link from "next/link";

import styles from "./AdminPortalCommandBar.module.css";

export function AdminPortalCommandBar({
  workHref,
  searchAvailable,
}: Readonly<{
  workHref: `/admin/${string}` | null;
  searchAvailable: boolean;
}>) {
  return (
    <div className={styles.commands} aria-label="Administrative commands">
      {searchAvailable ? (
        <form className={styles.search} action="/admin/search" method="get" role="search">
          <label htmlFor="admin-universal-search" className={styles.visuallyHidden}>
            Search administration
          </label>
          <input
            id="admin-universal-search"
            name="q"
            type="search"
            minLength={2}
            maxLength={160}
            placeholder="Search administration"
            autoComplete="off"
          />
          <button type="submit">Search</button>
        </form>
      ) : null}
      {workHref ? (
        <Link className={styles.workLink} href={workHref}>
          Work
        </Link>
      ) : null}
    </div>
  );
}
