import React, { FC } from 'react';
import { Page, Text, View, Document, StyleSheet, PDFViewer, Image } from '@react-pdf/renderer';
import {t} from "i18next";

const styles = StyleSheet.create({
    page: {
        flexDirection: 'row',
        backgroundColor: '#E4E4E4',
    },
    canvas: {
        flex: 1,
        margin: 10,
        padding: 10,
        border: '1pt solid black',
    },
    headerText: {
        marginBottom: 5,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    viewer: {
        width: window.innerWidth,
        height: window.innerHeight,
    },
})

interface PDFProps {
    canvas1ImageSrc: string
    canvas2ImageSrc: string
}

const PDF: FC<PDFProps> = ({ canvas1ImageSrc, canvas2ImageSrc }) => (
    <PDFViewer style={styles.viewer}>
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.canvas}>
                    <Text style={styles.headerText}>{t("navbar.leftEye")}</Text>
                    <Image style={styles.image} src={canvas1ImageSrc} />
                </View>
            </Page>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.canvas}>
                    <Text style={styles.headerText}>{t("navbar.rightEye")}</Text>
                    <Image style={styles.image} src={canvas2ImageSrc} />
                </View>
            </Page>
        </Document>
    </PDFViewer>
);

export default PDF