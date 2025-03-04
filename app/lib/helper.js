export function entriesToMarkDown(entries, type) {
    if (!entries?.length) return ""; // Fixed "length" typo

    return (
        `## ${type}\n\n` +
        entries
            .map((entry) => {
                const dateRange = entry.current
                    ? `${entry.startDate} - Present`
                    : `${entry.startDate} - ${entry.endDate}`;

                return `### ${entry.title} @ ${entry.organization}\n**${dateRange}**\n\n${entry.description}`;
            })
            .join("\n\n")
    );
}
