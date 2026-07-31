"use client";

import { useEffect, useState } from "react";

import {
  readMapRotationPreference,
  writeMapRotationPreference,
} from "../map/map-motion-preference";

import styles from "./MapMotionPreferenceToggle.module.css";

export function MapMotionPreferenceToggle() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(readMapRotationPreference());
  }, []);

  return (
    <div className={styles.preference}>
      <div>
        <h3>Ambient map rotation</h3>
        <p>
          Allow the Exchange map to rotate slowly around your locality and organization marker
          when the camera is in an ambient home scene. Manual map interaction still pauses motion.
        </p>
      </div>
      <label className={styles.switch}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => {
            const next = event.target.checked;
            setEnabled(next);
            writeMapRotationPreference(next);
          }}
        />
        <span aria-hidden="true" />
        <strong>{enabled ? "On" : "Off"}</strong>
      </label>
    </div>
  );
}
