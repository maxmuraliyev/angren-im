import About from '../sections/About';
import WhyUs from '../sections/WhyUs';

export default function AboutPage() {
  return (
    <div style={{ minHeight: 'calc(100vh - 250px)' }}>
      <About />
      <WhyUs />
    </div>
  );
}
