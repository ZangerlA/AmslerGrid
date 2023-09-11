import { Document, Image, Page, PDFViewer, StyleSheet, Text, View } from "@react-pdf/renderer"
import { t } from "i18next"
import React, { FC } from "react"
import { Dimension } from "../customHooks/UseWindowDimensions"

interface PDFProps {
	dimensionCanvas1: Dimension
	dimensionCanvas2: Dimension
	canvas1ImageSrc: string
	canvas2ImageSrc: string
}

const PDF: FC<PDFProps> = ({ dimensionCanvas1, dimensionCanvas2, canvas1ImageSrc, canvas2ImageSrc }) => {

	const computeScaleFactor = (imageWidth: number, imageHeight: number, maxWidth: number, maxHeight: number): number => {
		const widthScale = maxWidth / imageWidth
		const heightScale = maxHeight / imageHeight

		// Use the smaller scale to ensure the image fits in both dimensions.
		return Math.min(widthScale, heightScale)
	}

	const pageWidth = 800  // Approx width of A4 landscape in mm. You might want to subtract any padding/margins.
	const pageHeight = 500 // Approx height of A4 landscape in mm. You might want to subtract any padding/margins.

	const scaleFactor1 = computeScaleFactor(dimensionCanvas1.width, dimensionCanvas1.height, pageWidth, pageHeight)
	const scaleFactor2 = computeScaleFactor(dimensionCanvas2.width, dimensionCanvas2.height, pageWidth, pageHeight)

	const styles = StyleSheet.create({
		page: {
			flexDirection: "row",
			backgroundColor: "white",
		},
		canvas: {
			flex: 1,
			margin: 10,
			padding: 10,
			alignItems: "center",
			justifyContent: "center",
		},
		headerText: {
			marginBottom: 5,
		},
		image1: {
			width: dimensionCanvas1.width * scaleFactor1,
			height: dimensionCanvas1.height * scaleFactor1,
		},
		image2: {
			width: dimensionCanvas2.width * scaleFactor2,
			height: dimensionCanvas2.height * scaleFactor2,
		},
		viewer: {
			width: window.innerWidth,
			height: window.innerHeight,
		},
	})
	return (
		<PDFViewer style={styles.viewer}>
			<Document>
				<Page size="A4" orientation="landscape" style={styles.page}>
					<View style={styles.canvas}>
						<Text style={styles.headerText}>{t("navbar.leftEye")}</Text>
						<Image style={styles.image1} src={canvas1ImageSrc}/>
					</View>
				</Page>
				<Page size="A4" orientation="landscape" style={styles.page}>
					<View style={styles.canvas}>
						<Text style={styles.headerText}>{t("navbar.rightEye")}</Text>
						<Image style={styles.image2} src={canvas2ImageSrc}/>
					</View>
				</Page>
			</Document>
		</PDFViewer>
	)
}

export default PDF