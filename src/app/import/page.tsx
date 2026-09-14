import CsvImportSection from './CsvImportSection';
import ImageImportSection from './ImageImportSection';

export default function ImportPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-brand-night-dark">データ取込</h1>
      <ImageImportSection />
      <CsvImportSection />
    </div>
  );
}
