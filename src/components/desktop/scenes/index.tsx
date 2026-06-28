import type { ActiveTicketSnapshot, AppId } from '@/core/snapshot';
import { EditorScene } from './EditorScene';
import { BrowserScene } from './BrowserScene';
import { MeetScene } from './MeetScene';
import { SlackScene } from './SlackScene';
import { MailScene } from './MailScene';

const SCENES: Record<AppId, (active: ActiveTicketSnapshot) => React.ReactNode> = {
  editor: (a) => <EditorScene active={a} />,
  browser: (a) => <BrowserScene active={a} />,
  meet: (a) => <MeetScene active={a} />,
  slack: (a) => <SlackScene active={a} />,
  mail: (a) => <MailScene active={a} />,
};

export function Scene({ active }: { active: ActiveTicketSnapshot }) {
  return <>{SCENES[active.app](active)}</>;
}
