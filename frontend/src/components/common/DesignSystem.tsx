import React, { useState } from 'react';
import {
  Badge,
  Button,
  Card, CardHeader, CardBody,
  KpiCard,
  DataProvenance,
  DataTable,
  Alert,
  EmptyState,
  LoadingSpinner, Skeleton, LoadingPage,
  Input, Select,
  Modal,
  Drawer,
} from '../ui';
import type { Column } from '../ui';
import { Truck, Sprout, Search, Package } from 'lucide-react';

/**
 * DesignSystem — Development-only reference component.
 * Renders all AgriDirect design tokens and UI primitives.
 */
export const DesignSystem: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  /* Sample table data */
  interface SampleRow {
    commodity: string;
    region: string;
    price: number;
    change: string;
    status: string;
  }

  const sampleColumns: Column<SampleRow>[] = [
    { key: 'commodity', header: 'Commodity' },
    { key: 'region', header: 'Region' },
    { key: 'price', header: 'Price (₹/kg)', numeric: true, render: (row) => `₹${row.price.toFixed(2)}` },
    { key: 'change', header: 'Change', numeric: true },
    {
      key: 'status', header: 'Status', render: (row) => (
        <Badge variant={row.status === 'Active' ? 'success' : 'warning'} dot>
          {row.status}
        </Badge>
      ),
    },
  ];

  const sampleData: SampleRow[] = [
    { commodity: 'Tomato (Hybrid Red)', region: 'Kolar, Karnataka', price: 32.0, change: '+2.4%', status: 'Active' },
    { commodity: 'Red Onion', region: 'Nashik, Maharashtra', price: 23.0, change: '-1.2%', status: 'Active' },
    { commodity: 'Wheat (Kalyan Sona)', region: 'Ludhiana, Punjab', price: 24.5, change: '+0.8%', status: 'Pending' },
    { commodity: 'White Potato', region: 'Agra, UP', price: 16.8, change: '-0.5%', status: 'Active' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-12">
      {/* Header */}
      <div>
        <p className="text-ad-overline uppercase tracking-wider" style={{ color: 'var(--ad-text-tertiary)' }}>
          Development Reference
        </p>
        <h1 className="text-ad-display mt-1">AgriDirect Design System</h1>
        <p className="text-ad-body mt-2" style={{ color: 'var(--ad-text-secondary)', maxWidth: '640px' }}>
          Tokens, primitives, and patterns for the AgriDirect enterprise agricultural commerce interface.
          This page is for development use only.
        </p>
      </div>

      <hr style={{ borderColor: 'var(--ad-border)' }} />

      {/* ================================================================
          COLOR TOKENS
          ================================================================ */}
      <section>
        <h2 className="text-ad-heading mb-4">Color Tokens</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { name: 'Background',    var: '--ad-bg',             dark: false },
            { name: 'Bg Alt',        var: '--ad-bg-alt',         dark: false },
            { name: 'Surface',       var: '--ad-surface',        dark: false },
            { name: 'Border',        var: '--ad-border',         dark: false },
            { name: 'Border Strong', var: '--ad-border-strong',  dark: false },
            { name: 'Text Primary',  var: '--ad-text-primary',   dark: true },
            { name: 'Text Secondary',var: '--ad-text-secondary', dark: true },
            { name: 'Text Tertiary', var: '--ad-text-tertiary',  dark: false },
            { name: 'Green 50',      var: '--ad-green-50',       dark: false },
            { name: 'Green 100',     var: '--ad-green-100',      dark: false },
            { name: 'Green 600',     var: '--ad-green-600',      dark: true },
            { name: 'Green 700',     var: '--ad-green-700',      dark: true },
            { name: 'Amber 50',      var: '--ad-amber-50',       dark: false },
            { name: 'Amber 600',     var: '--ad-amber-600',      dark: true },
            { name: 'Red 50',        var: '--ad-red-50',         dark: false },
            { name: 'Red 600',       var: '--ad-red-600',        dark: true },
            { name: 'Blue 50',       var: '--ad-blue-50',        dark: false },
            { name: 'Blue 600',      var: '--ad-blue-600',       dark: true },
          ].map(c => (
            <div key={c.var} className="ad-card overflow-hidden">
              <div
                className="h-12 w-full"
                style={{ backgroundColor: `var(${c.var})` }}
              />
              <div className="px-3 py-2">
                <div className="text-ad-caption font-semibold" style={{ color: 'var(--ad-text-primary)' }}>{c.name}</div>
                <code className="text-ad-overline font-mono" style={{ color: 'var(--ad-text-tertiary)' }}>{c.var}</code>
              </div>
            </div>
          ))}
        </div>
      </section>

      <hr style={{ borderColor: 'var(--ad-border)' }} />

      {/* ================================================================
          TYPOGRAPHY
          ================================================================ */}
      <section>
        <h2 className="text-ad-heading mb-4">Typography Scale</h2>
        <div className="ad-card">
          <div className="ad-card-body space-y-4">
            <div>
              <span className="text-ad-overline uppercase" style={{ color: 'var(--ad-text-tertiary)' }}>Display · 1.5rem / 700</span>
              <p className="text-ad-display">Agricultural Commerce Infrastructure</p>
            </div>
            <div>
              <span className="text-ad-overline uppercase" style={{ color: 'var(--ad-text-tertiary)' }}>Heading · 1.125rem / 600</span>
              <p className="text-ad-heading">Market Outlook for Delhi-NCR Region</p>
            </div>
            <div>
              <span className="text-ad-overline uppercase" style={{ color: 'var(--ad-text-tertiary)' }}>Subheading · 0.875rem / 600</span>
              <p className="text-ad-subheading">Value Flow Breakdown</p>
            </div>
            <div>
              <span className="text-ad-overline uppercase" style={{ color: 'var(--ad-text-tertiary)' }}>Body · 0.875rem / 400</span>
              <p className="text-ad-body" style={{ color: 'var(--ad-text-primary)' }}>Direct agricultural commerce connecting verified farmer producer organizations with institutional buyers.</p>
            </div>
            <div>
              <span className="text-ad-overline uppercase" style={{ color: 'var(--ad-text-tertiary)' }}>Body Small · 0.8125rem / 400</span>
              <p className="text-ad-body-sm" style={{ color: 'var(--ad-text-secondary)' }}>Prototype aligned with the Department of Consumer Affairs problem statement.</p>
            </div>
            <div>
              <span className="text-ad-overline uppercase" style={{ color: 'var(--ad-text-tertiary)' }}>Caption · 0.75rem / 500</span>
              <p className="text-ad-caption" style={{ color: 'var(--ad-text-secondary)' }}>Source: AGMARKNET / CEDA · Updated: 2026-08-23</p>
            </div>
            <div>
              <span className="text-ad-overline uppercase" style={{ color: 'var(--ad-text-tertiary)' }}>Monospace · 0.8125rem / 500</span>
              <p className="font-mono ad-metric" style={{ fontSize: '0.8125rem' }}>₹24.50/kg · 4,500 kg · ID: FPO-LDH-001</p>
            </div>
          </div>
        </div>
      </section>

      <hr style={{ borderColor: 'var(--ad-border)' }} />

      {/* ================================================================
          BADGES
          ================================================================ */}
      <section>
        <h2 className="text-ad-heading mb-4">Badges</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="neutral">Draft</Badge>
          <Badge variant="success" dot>Active</Badge>
          <Badge variant="warning" dot>Pending Review</Badge>
          <Badge variant="error" dot>Rejected</Badge>
          <Badge variant="info">Grade A</Badge>
          <Badge variant="success">Verified</Badge>
          <Badge variant="warning">Simulated</Badge>
        </div>
      </section>

      <hr style={{ borderColor: 'var(--ad-border)' }} />

      {/* ================================================================
          BUTTONS
          ================================================================ */}
      <section>
        <h2 className="text-ad-heading mb-4">Buttons</h2>
        <div className="space-y-4">
          <div>
            <p className="text-ad-caption mb-2" style={{ color: 'var(--ad-text-secondary)' }}>Variants</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Place Order</Button>
              <Button variant="secondary">Cancel</Button>
              <Button variant="ghost">View Details</Button>
              <Button variant="danger">Remove Listing</Button>
            </div>
          </div>
          <div>
            <p className="text-ad-caption mb-2" style={{ color: 'var(--ad-text-secondary)' }}>With Icons</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" icon={<Truck className="w-4 h-4" />}>Plan Transport</Button>
              <Button variant="secondary" icon={<Search className="w-4 h-4" />}>Search</Button>
            </div>
          </div>
          <div>
            <p className="text-ad-caption mb-2" style={{ color: 'var(--ad-text-secondary)' }}>States</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" disabled>Disabled</Button>
              <Button variant="primary" loading>Submitting…</Button>
              <Button variant="secondary" size="sm">Small</Button>
            </div>
          </div>
        </div>
      </section>

      <hr style={{ borderColor: 'var(--ad-border)' }} />

      {/* ================================================================
          CARDS
          ================================================================ */}
      <section>
        <h2 className="text-ad-heading mb-4">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader action={<Badge variant="success" dot>Active</Badge>}>
              <h3 className="text-ad-subheading">Tomato (Hybrid Red)</h3>
              <p className="text-ad-caption" style={{ color: 'var(--ad-text-secondary)' }}>Kolar Tomato Growers Union</p>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-3 text-ad-body-sm">
                <div>
                  <span style={{ color: 'var(--ad-text-tertiary)' }}>Quantity</span>
                  <p className="font-mono ad-metric">2,800 kg</p>
                </div>
                <div>
                  <span style={{ color: 'var(--ad-text-tertiary)' }}>Farmer Target</span>
                  <p className="font-mono ad-metric" style={{ color: 'var(--ad-green-600)' }}>₹32.00/kg</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-ad-subheading">Punjab–Delhi Corridor</h3>
              <p className="text-ad-caption" style={{ color: 'var(--ad-text-secondary)' }}>Trade corridor summary</p>
            </CardHeader>
            <CardBody>
              <p className="text-ad-body-sm" style={{ color: 'var(--ad-text-secondary)' }}>
                14 active routes connecting FPO clusters in Punjab to Delhi-NCR distribution hubs.
                Price variance reduced by 32%.
              </p>
              <div className="mt-3">
                <DataProvenance source="AGMARKNET / CEDA" updatedAt="2026-08-23 14:30" />
              </div>
            </CardBody>
          </Card>
        </div>
      </section>

      <hr style={{ borderColor: 'var(--ad-border)' }} />

      {/* ================================================================
          KPI CARDS
          ================================================================ */}
      <section>
        <h2 className="text-ad-heading mb-4">KPI Cards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Farmer Value Captured"
            value="₹28,45,000"
            change="+28.4% vs intermediary"
            changeDirection="positive"
            provenance={{ source: 'Platform data', simulated: true }}
          />
          <KpiCard
            label="Consumer Cost Impact"
            value="-18.6%"
            change="Landed cost reduction"
            changeDirection="positive"
            provenance={{ source: 'Platform data', simulated: true }}
          />
          <KpiCard
            label="Active Supply"
            value="15,500 kg"
            change="4 active batches"
            changeDirection="neutral"
            provenance={{ source: 'Platform data', simulated: true }}
          />
          <KpiCard
            label="Supply Risk"
            value="Low"
            change="91.2 stability index"
            changeDirection="positive"
            provenance={{ source: 'Calculated', updatedAt: '14:30' }}
          />
        </div>
      </section>

      <hr style={{ borderColor: 'var(--ad-border)' }} />

      {/* ================================================================
          DATA PROVENANCE
          ================================================================ */}
      <section>
        <h2 className="text-ad-heading mb-4">Data Provenance</h2>
        <div className="space-y-3">
          <div>
            <DataProvenance source="AGMARKNET / CEDA" updatedAt="2026-08-23 14:30 IST" />
          </div>
          <div>
            <DataProvenance source="Open-Meteo Weather" updatedAt="2026-08-23 12:00 IST" />
          </div>
          <div>
            <DataProvenance source="Synthetic simulation" simulated />
          </div>
        </div>
      </section>

      <hr style={{ borderColor: 'var(--ad-border)' }} />

      {/* ================================================================
          TABLE
          ================================================================ */}
      <section>
        <h2 className="text-ad-heading mb-4">Data Table</h2>
        <Card>
          <CardBody className="p-0">
            <DataTable
              columns={sampleColumns}
              data={sampleData}
              rowKey={(row) => row.commodity}
              caption="Commodity price overview"
            />
          </CardBody>
        </Card>
      </section>

      <hr style={{ borderColor: 'var(--ad-border)' }} />

      {/* ================================================================
          ALERTS
          ================================================================ */}
      <section>
        <h2 className="text-ad-heading mb-4">Alerts</h2>
        <div className="space-y-3 max-w-2xl">
          <Alert variant="info" title="Data refresh scheduled">
            Market prices will be updated at the next AGMARKNET sync cycle (15:00 IST).
          </Alert>
          <Alert variant="warning" title="High spoilage risk">
            Tomato batch FPO-KLR-003 has 3 days remaining shelf life. Prioritize dispatch.
          </Alert>
          <Alert variant="error" title="Transport plan failed">
            Unable to calculate optimized route. Insufficient vehicle capacity for selected batches.
          </Alert>
          <Alert variant="success" title="Order confirmed">
            Direct order #ORD-2026-0451 has been confirmed. Escrow amount locked.
          </Alert>
        </div>
      </section>

      <hr style={{ borderColor: 'var(--ad-border)' }} />

      {/* ================================================================
          FORM INPUTS
          ================================================================ */}
      <section>
        <h2 className="text-ad-heading mb-4">Form Inputs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <Input label="Quantity (kg)" type="number" placeholder="Enter quantity" hint="Minimum 100 kg per batch" />
          <Input label="Target Price (₹/kg)" type="number" placeholder="0.00" error="Price must be greater than broker baseline" />
          <Select
            label="Commodity"
            options={[
              { value: 'tomato', label: 'Tomato (Hybrid Red)' },
              { value: 'onion', label: 'Red Onion (Nashik)' },
              { value: 'wheat', label: 'Wheat (Kalyan Sona)' },
              { value: 'potato', label: 'White Potato (Jyoti)' },
            ]}
            placeholder="Select commodity"
          />
          <Input label="Search" type="text" placeholder="Search commodities, FPOs…" />
        </div>
      </section>

      <hr style={{ borderColor: 'var(--ad-border)' }} />

      {/* ================================================================
          LOADING STATES
          ================================================================ */}
      <section>
        <h2 className="text-ad-heading mb-4">Loading States</h2>
        <div className="space-y-6">
          <div>
            <p className="text-ad-caption mb-3" style={{ color: 'var(--ad-text-secondary)' }}>Spinners</p>
            <div className="flex items-center gap-4">
              <LoadingSpinner size="sm" />
              <LoadingSpinner size="md" />
              <LoadingSpinner size="lg" />
            </div>
          </div>
          <div>
            <p className="text-ad-caption mb-3" style={{ color: 'var(--ad-text-secondary)' }}>Skeletons</p>
            <div className="space-y-2 max-w-md">
              <Skeleton width="60%" height="20px" />
              <Skeleton width="100%" height="14px" />
              <Skeleton width="80%" height="14px" />
              <div className="flex gap-3 mt-3">
                <Skeleton width="80px" height="80px" />
                <div className="flex-1 space-y-2">
                  <Skeleton width="100%" height="14px" />
                  <Skeleton width="70%" height="14px" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr style={{ borderColor: 'var(--ad-border)' }} />

      {/* ================================================================
          EMPTY STATE
          ================================================================ */}
      <section>
        <h2 className="text-ad-heading mb-4">Empty State</h2>
        <Card>
          <EmptyState
            icon={<Package className="w-full h-full" />}
            title="No produce batches found"
            description="Try adjusting your search filters or check back later for new listings from verified FPOs."
            action={<Button variant="secondary" size="sm">Clear Filters</Button>}
          />
        </Card>
      </section>

      <hr style={{ borderColor: 'var(--ad-border)' }} />

      {/* ================================================================
          MODAL & DRAWER
          ================================================================ */}
      <section>
        <h2 className="text-ad-heading mb-4">Modal & Drawer</h2>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            Open Modal
          </Button>
          <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
            Open Drawer
          </Button>
        </div>

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Confirm Order"
          footer={
            <>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => setModalOpen(false)}>Confirm</Button>
            </>
          }
        >
          <p className="text-ad-body" style={{ color: 'var(--ad-text-secondary)' }}>
            Place a direct order for 2,800 kg of Tomato (Hybrid Red) from Kolar Tomato Growers Union
            at ₹32.00/kg? Total cost: ₹89,600.
          </p>
          <div className="mt-3">
            <Alert variant="info">
              Escrow will be locked upon confirmation. Payment released after delivery verification.
            </Alert>
          </div>
        </Modal>

        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Why this forecast?"
          footer={
            <Button variant="ghost" onClick={() => setDrawerOpen(false)}>Close</Button>
          }
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-ad-subheading mb-1">Market Drivers</h3>
              <ul className="text-ad-body-sm space-y-2" style={{ color: 'var(--ad-text-secondary)' }}>
                <li>• <strong>Arrivals:</strong> Below-average mandi arrivals in Delhi-NCR over the past 7 days.</li>
                <li>• <strong>Historical trend:</strong> Tomato prices typically rise 8–12% in late August.</li>
                <li>• <strong>Weather:</strong> High ambient moisture and humidity in southern belts, accelerating perishability.</li>
                <li>• <strong>Demand:</strong> Festive season demand surge expected in metro markets.</li>
              </ul>
            </div>
            <div className="pt-3 border-t" style={{ borderColor: 'var(--ad-border)' }}>
              <h3 className="text-ad-subheading mb-1">Model Information</h3>
              <p className="text-ad-body-sm" style={{ color: 'var(--ad-text-secondary)' }}>
                14-day forward forecast using time-series regression on AGMARKNET historical prices,
                mandi arrival volumes, and Open-Meteo weather features.
              </p>
              <div className="mt-2">
                <DataProvenance source="AGMARKNET + Open-Meteo" updatedAt="2026-08-23 14:30 IST" />
              </div>
            </div>
          </div>
        </Drawer>
      </section>

      <hr style={{ borderColor: 'var(--ad-border)' }} />

      {/* ================================================================
          BORDER RADIUS & SHADOWS
          ================================================================ */}
      <section>
        <h2 className="text-ad-heading mb-4">Border Radius & Shadows</h2>
        <div className="flex flex-wrap gap-6">
          {[
            { name: 'radius-sm (4px)', radius: 'var(--ad-radius-sm)', shadow: 'none' },
            { name: 'radius-md (6px)', radius: 'var(--ad-radius-md)', shadow: 'var(--ad-shadow-sm)' },
            { name: 'radius-lg (8px)', radius: 'var(--ad-radius-lg)', shadow: 'var(--ad-shadow-md)' },
            { name: 'shadow-lg',       radius: 'var(--ad-radius-lg)', shadow: 'var(--ad-shadow-lg)' },
          ].map(item => (
            <div
              key={item.name}
              className="w-28 h-20 flex items-center justify-center"
              style={{
                background: 'var(--ad-surface)',
                border: '1px solid var(--ad-border)',
                borderRadius: item.radius,
                boxShadow: item.shadow,
              }}
            >
              <span className="text-ad-caption" style={{ color: 'var(--ad-text-tertiary)' }}>{item.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Spacer */}
      <div className="h-8" />
    </div>
  );
};
