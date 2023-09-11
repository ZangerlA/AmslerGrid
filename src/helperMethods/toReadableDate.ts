export const toReadableDate = (date: number): string => {
	const dateObj = new Date(date)
	const SS = String(dateObj.getSeconds()).padStart(2, "0")
	const MM = String(dateObj.getMinutes()).padStart(2, "0")
	const HH = String(dateObj.getHours()).padStart(2, "0")
	const DD = String(dateObj.getDate()).padStart(2, "0")
	const MMth = String(dateObj.getMonth() + 1).padStart(2, "0")
	const YYYY = String(dateObj.getFullYear()).slice(0)
	return `${YYYY}.${MMth}.${DD} - ${HH}:${MM}:${SS}`
}