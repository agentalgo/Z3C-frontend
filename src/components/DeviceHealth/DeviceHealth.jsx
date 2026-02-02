// Packages
import { Fragment } from 'react';

const devices = [
  { name: 'Main ERP (SAP)', status: 'Live', color: 'bg-green-500' },
  { name: 'Store Front 01', status: 'Live', color: 'bg-green-500' },
  { name: 'B2B Portal API', status: 'Latency High', color: 'bg-amber-500' },
];

function DeviceHealth() {
  const DEVICE_ITEM = (device) => (
    <div key={device.name} className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${device.color}`} />
        <p className="text-sm">{device.name}</p>
      </div>
      <p className="text-xs font-medium text-[#4c669a]">{device.status}</p>
    </div>
  )

  const DEVICES_LIST = () => (
    <div className="space-y-4">
      {devices.map((device) => DEVICE_ITEM(device))}
    </div>
  );

  const HEADER_SECTION = () => (
    <div className="flex items-center justify-between mb-6">
      <h4 className="text-sm font-bold uppercase tracking-wider text-[#4c669a]">Device Health</h4>
      <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">All Active</span>
    </div>
  )

  const DEVICE_HEALTH_CONTENT = () => (
    <Fragment>
      {HEADER_SECTION()}
      {DEVICES_LIST()}
    </Fragment>
  );

  return (
    <div className="bg-white dark:bg-[#161f30] rounded-xl border border-[#e7ebf3] dark:border-[#2a3447] p-6 shadow-sm">
      {DEVICE_HEALTH_CONTENT()}
    </div>
  );
}

export default DeviceHealth;
