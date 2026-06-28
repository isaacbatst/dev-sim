import type { ActiveTicketSnapshot, AppId, SlotSnapshot } from '@/core/snapshot';
import { EditorScene } from './EditorScene';
import { BrowserScene } from './BrowserScene';
import { MeetScene } from './MeetScene';
import { SlackScene } from './SlackScene';
import { MailScene } from './MailScene';

type Slots = (SlotSnapshot | null)[];

const SCENES: Record<AppId, (active: ActiveTicketSnapshot, slots: Slots) => React.ReactNode> = {
  editor: (a) => <EditorScene active={a} />,
  browser: (a, slots) => <BrowserScene active={a} slots={slots} />,
  meet: (a) => <MeetScene active={a} />,
  slack: (a) => <SlackScene active={a} />,
  mail: (a) => <MailScene active={a} />,
};

export function Scene({ active, slots }: { active: ActiveTicketSnapshot; slots: Slots }) {
  return <>{SCENES[active.app](active, slots)}</>;
}
