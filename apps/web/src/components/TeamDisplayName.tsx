import { getTeamDisplay, type TeamDisplayInput } from "../services/teamDisplay";

interface TeamDisplayNameProps {
  team: string | TeamDisplayInput;
  codeClassName?: string;
}

export function TeamDisplayName({ codeClassName, team }: TeamDisplayNameProps) {
  const display = getTeamDisplay(team);

  return (
    <span className="team-display">
      {display.flagImageUrl && (
        <img
          alt={`${display.name}国旗`}
          className="team-display__flag"
          height={14}
          loading="lazy"
          src={display.flagImageUrl}
          width={20}
        />
      )}
      <span>{display.name}</span>
      {display.code && <small className={codeClassName}>{display.code}</small>}
    </span>
  );
}
