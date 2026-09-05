"use client";

import Link from "next/link";
import { useId, useState } from "react";

import type { ImplementedAdminRuntimeDestination, ImplementedAdminRuntimeDestinationKey } from "../../application/admin/portal-navigation";
import { BrandWordmark } from "../brand/BrandWordmark";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./AdminPortalShell.module.css";

export interface AdminPortalNavigationProps {
  readonly destinations: readonly Readonly<{ navigationId:string; key:ImplementedAdminRuntimeDestinationKey; labelKey:ImplementedAdminRuntimeDestination["labelKey"]; description:string; href:`/admin/${string}`; scopeValue:string; scopeTargetId:string|null }>[];
  readonly currentDestination?: ImplementedAdminRuntimeDestinationKey;
  readonly currentScope?: string;
}

export function AdminPortalNavigation({destinations,currentDestination,currentScope}:AdminPortalNavigationProps){
  const {t}=useI18n(); const[open,setOpen]=useState(false); const navigationId=useId().replaceAll(":","");
  const primary=destinations.filter((destination)=>destination.key!=="organization-claims");
  return <aside className={styles.navigation} data-open={open?"true":"false"}>
    <div className={styles.navigationTop}><BrandWordmark onDark compact/><button type="button" className={styles.mobileMenuButton} aria-expanded={open} aria-controls={navigationId} onClick={()=>setOpen((current)=>!current)}><span aria-hidden="true">{open?"×":"≡"}</span>{open?"Close":"Menu"}</button></div>
    <div className={styles.navigationBody} id={navigationId}>
      <div className={styles.heading}><span>{t("participantNavigation.administration")}</span><strong>Authorized workspaces</strong></div>
      <nav aria-label={t("participantNavigation.adminAriaLabel")}><p className={styles.navigationLabel}>Available now</p><ul>
        {primary.map((destination)=><li key={destination.navigationId}><Link href={destination.href} aria-current={currentDestination===destination.key&&currentScope===destination.scopeValue?"page":undefined} title={destination.description} onClick={()=>setOpen(false)}><span>{t(`participantNavigation.${destination.labelKey}`)}</span>{destination.scopeTargetId?<small>{destination.scopeTargetId}</small>:null}</Link></li>)}
      </ul></nav>
      <Link className={styles.participantAccount} href="/organization-profile" onClick={()=>setOpen(false)}><span aria-hidden="true">←</span>{t("participantNavigation.participantAccount")}</Link>
    </div>
  </aside>;
}
