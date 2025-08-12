import { SEO } from "@/components/seo/SEO";
import { JsonLd } from "@/components/seo/JsonLd";

const Index = () => {
  return (
    <>
      <SEO title="Hangar Guardian" description="Predictive maintenance and IoT monitoring dashboard." />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "Hangar Guardian",
        description: "Predictive maintenance and IoT monitoring dashboard.",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: window.location.origin
      }} />
      <div className="min-h-screen flex items-center justify-center bg-background animate-fade-in">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to Your Blank App</h1>
          <p className="text-xl text-muted-foreground">Start building your amazing project here!</p>
        </div>
      </div>
    </>
  );
};

export default Index;
