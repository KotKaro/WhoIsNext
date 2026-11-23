import { useRef, useState } from 'react';
import { copyText } from '../../platform/clipboard';
import { text } from '../../text';
import styles from './team.module.css';

interface ShareCardProps {
  teamId: string;
  justCreated: boolean;
}

export function ShareCard({ teamId, justCreated }: ShareCardProps) {
  const [copied, setCopied] = useState(false);
  const linkRef = useRef<HTMLInputElement>(null);
  const link = new URL(`/t/${teamId}`, window.location.origin).href;

  async function onCopy() {
    try {
      await copyText(link);
      setCopied(true);
    } catch {
      // Without clipboard access the link is selected, ready to copy by hand.
      linkRef.current?.select();
    }
  }

  return (
    <div className="card">
      <p className="muted small">{justCreated ? text.share.created : text.share.hint}</p>
      <div className={styles.link}>
        <input ref={linkRef} value={link} readOnly aria-label={text.share.linkLabel} />
        <button type="button" onClick={onCopy}>{copied ? text.share.copied : text.share.copy}</button>
      </div>
    </div>
  );
}
