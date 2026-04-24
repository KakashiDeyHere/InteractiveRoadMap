# Job Search Configuration

## Search Parameters

| Field        | Value                          |
|--------------|-------------------------------|
| Role         | Data Engineer / Data Engineering |
| Location     | Remote only                   |
| Job boards   | Dice.com, Indeed.com          |
| Frequency    | Daily (9:00 AM)               |
| Lookback     | Last 24 hours                 |

## Search Queries Used

- `site:dice.com "data engineer" remote`
- `site:indeed.com "data engineer" remote`
- `"data engineer" remote jobs -site:linkedin.com`

## Output

Results are appended (newest first) to `job-search/digest.md`.

## Updating These Settings

Edit this file to track any changes to search preferences.
The scheduled agent prompt will need to be updated separately if keywords or boards change.
