import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
  family: 'Inter',
  src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGsmZhrib2Bg-4.ttf', fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Inter', fontSize: 11, lineHeight: 1.5, color: '#1a1a1a' },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', textTransform: 'uppercase' },
  content: { marginBottom: 20, textAlign: 'justify' },
  signatureSection: { marginTop: 50, borderTop: '1 solid #ccc', paddingTop: 10, width: '60%', textAlign: 'center' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, textAlign: 'center', color: '#666' }
});

export const ContractPDF = ({ content }: { content: string }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Contrato de Prestação de Serviços Fotográficos</Text>
      <View style={styles.content}>
        <Text>{content}</Text>
      </View>
      <View style={styles.signatureSection}>
        <Text>Assinatura Digital - Aceite via Plataforma</Text>
      </View>
      <Text style={styles.footer}>Documento gerado digitalmente.</Text>
    </Page>
  </Document>
);
