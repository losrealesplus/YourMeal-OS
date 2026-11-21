/**
 * CR-COST-05 PR5: Market Connector Registry
 *
 * Central registry of decoupled, isolated connectors for public catalogs and authorized feeds.
 * Ensures strict enforcement of RestrictedSourcePolicy during registration.
 */

import { IMarketSourceConnector, MarketConnectorMetadata } from '../../domain/connector-types';
import { RestrictedSourcePolicy } from './restricted-source-policy';

export class MarketConnectorRegistry {
  private readonly connectors = new Map<string, IMarketSourceConnector>();

  constructor(initialConnectors: IMarketSourceConnector[] = []) {
    for (const connector of initialConnectors) {
      this.registerConnector(connector);
    }
  }

  /**
   * Registers a connector. Throws if the source is restricted and attempts public scraping.
   */
  public registerConnector(connector: IMarketSourceConnector): void {
    if (!connector || !connector.metadata || !connector.metadata.id) {
      throw new Error('Conector inválido: metadata.id es obligatorio.');
    }

    const { sourceId, accessMode } = connector.metadata;

    if (accessMode === 'public_pdf' || accessMode === 'public_structured_feed') {
      RestrictedSourcePolicy.assertScrapingAllowed(sourceId);
    }

    this.connectors.set(connector.metadata.id, connector);
  }

  public getConnector(connectorId: string): IMarketSourceConnector | undefined {
    return this.connectors.get(connectorId);
  }

  public listConnectors(): MarketConnectorMetadata[] {
    return Array.from(this.connectors.values()).map((c) => c.metadata);
  }

  public getConnectorsBySource(sourceId: string): IMarketSourceConnector[] {
    const normalized = sourceId.trim().toLowerCase();
    return Array.from(this.connectors.values()).filter(
      (c) => c.metadata.sourceId.toLowerCase() === normalized
    );
  }

  public unregisterConnector(connectorId: string): boolean {
    return this.connectors.delete(connectorId);
  }

  public clear(): void {
    this.connectors.clear();
  }
}
