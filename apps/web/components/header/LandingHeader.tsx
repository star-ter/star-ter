import GlobalHeader from './GlobalHeader';

export default function LandingHeader() {
  const logo = (
    <h1 className="text-2xl font-black text-blue-600 tracking-tighter cursor-pointer">
      STAR-TER
    </h1>
  );

  return <GlobalHeader leftContent={logo} />;
}
