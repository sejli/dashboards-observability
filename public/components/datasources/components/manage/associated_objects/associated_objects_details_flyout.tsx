/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiSpacer,
  EuiText,
  EuiIcon,
  EuiButtonEmpty,
  EuiFlexItem,
  EuiFlexGroup,
  EuiDescriptionList,
  EuiDescriptionListTitle,
  EuiDescriptionListDescription,
  EuiHorizontalRule,
  EuiTitle,
  EuiTableFieldDataColumnType,
  EuiInMemoryTable,
  EuiLink,
  EuiButton,
  EuiEmptyPrompt,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  AssociatedObject,
  CachedAcceleration,
  CachedColumn,
} from '../../../../../../common/types/data_connections';
import {
  isCatalogCacheFetching,
  redirectToExplorerWithDataSrc,
} from './utils/associated_objects_tab_utils';
import {
  getRenderAccelerationDetailsFlyout,
  getRenderCreateAccelerationFlyout,
} from '../../../../../plugin';
import { AccelerationStatus, getAccelerationName } from '../accelerations/utils/acceleration_utils';
import {
  ACCE_NO_DATA_TITLE,
  ACCE_NO_DATA_DESCRIPTION,
  CREATE_ACCELERATION_DESCRIPTION,
} from '../associated_objects/utils/associated_objects_tab_utils';
import { DATA_SOURCE_TYPES } from '../../../../../../common/constants/data_sources';
import { useLoadTableColumnsToCache } from '../../../../../../public/framework/catalog_cache/cache_loader';
import { CatalogCacheManager } from '../../../../../../public/framework/catalog_cache/cache_manager';
import { DirectQueryLoadingStatus } from '../../../../../../common/types/explorer';
import { useToast } from '../../../../../../public/components/common/toast';

export interface AssociatedObjectsFlyoutProps {
  tableDetail: AssociatedObject;
  datasourceName: string;
  resetFlyout: () => void;
  handleRefresh?: () => void;
}

export const AssociatedObjectsDetailsFlyout = ({
  tableDetail,
  datasourceName,
  resetFlyout,
  handleRefresh,
}: AssociatedObjectsFlyoutProps) => {
  const { loadStatus, startLoading } = useLoadTableColumnsToCache();
  const [tableColumns, setTableColumns] = useState<CachedColumn[] | undefined>([]);
  const [schemaData, setSchemaData] = useState<any>([]);
  const { setToast } = useToast();

  const DiscoverButton = () => {
    // TODO: display button if can be sent to discover
    return (
      <EuiButtonEmpty
        onClick={() => {
          if (tableDetail.type !== 'table') return;
          redirectToExplorerWithDataSrc(
            tableDetail.datasource,
            DATA_SOURCE_TYPES.S3Glue,
            tableDetail.database,
            tableDetail.name
          );
          resetFlyout();
        }}
      >
        <EuiIcon type={'discoverApp'} size="m" />
      </EuiButtonEmpty>
    );
  };

  const AccelerateButton = () => {
    return (
      <EuiButtonEmpty
        onClick={() =>
          renderCreateAccelerationFlyout(datasourceName, tableDetail.database, tableDetail.name)
        }
      >
        <EuiIcon type={'bolt'} size="m" />
      </EuiButtonEmpty>
    );
  };

  const DetailComponent = (detailProps: { title: string; description: any }) => {
    const { title, description } = detailProps;
    return (
      <EuiFlexItem>
        <EuiDescriptionList>
          <EuiDescriptionListTitle>{title}</EuiDescriptionListTitle>
          <EuiDescriptionListDescription>{description}</EuiDescriptionListDescription>
        </EuiDescriptionList>
      </EuiFlexItem>
    );
  };

  const ConnectionComponent = () => {
    return (
      <EuiFlexGroup direction="row">
        <DetailComponent title="Datasource connection" description={tableDetail.datasource} />
        <DetailComponent title="Database" description={tableDetail.database} />
        <DetailComponent title="Table" description={tableDetail.name} />
      </EuiFlexGroup>
    );
  };

  const TableTitleComponent = (titleProps: { title: string }) => {
    const { title } = titleProps;
    return (
      <>
        <EuiTitle size="s">
          <h4>{title}</h4>
        </EuiTitle>
        <EuiHorizontalRule margin="s" />
      </>
    );
  };

  const accelerationData = tableDetail.accelerations.map((acc, index) => ({
    ...acc,
    id: index,
  }));

  const accelerationColumns = [
    {
      field: 'name',
      name: 'Name',
      'data-test-subj': 'accelerationName',
      render: (_: string, item: CachedAcceleration) => {
        const name = getAccelerationName(item, datasourceName);
        return (
          <EuiLink
            onClick={() => renderAccelerationDetailsFlyout(item, datasourceName, handleRefresh)}
          >
            {name}
          </EuiLink>
        );
      },
    },
    {
      field: 'status',
      name: 'Status',
      render: (status) => <AccelerationStatus status={status} />,
    },
    {
      field: 'type',
      name: 'Type',
    },
  ] as Array<EuiTableFieldDataColumnType<any>>;

  const noDataMessage = (
    <EuiEmptyPrompt
      title={
        <h2>
          {i18n.translate('datasources.associatedObjectsFlyout.noAccelerationTitle', {
            defaultMessage: ACCE_NO_DATA_TITLE,
          })}
        </h2>
      }
      body={
        <p>
          {i18n.translate('datasources.associatedObjectsFlyout.noAccelerationDescription', {
            defaultMessage: ACCE_NO_DATA_DESCRIPTION,
          })}
        </p>
      }
      actions={
        <EuiButton
          color="primary"
          fill
          onClick={() =>
            renderCreateAccelerationFlyout(datasourceName, tableDetail.database, tableDetail.name)
          }
          iconType="popout"
          iconSide="left"
        >
          {i18n.translate('datasources.associatedObjectsFlyout.createAccelerationButton', {
            defaultMessage: CREATE_ACCELERATION_DESCRIPTION,
          })}
        </EuiButton>
      }
    />
  );

  const schemaColumns = [
    {
      field: 'name',
      name: 'Column Name',
      'data-test-subj': 'columnName',
    },
    {
      field: 'dataType',
      name: 'Data Type',
      'data-test-subj': 'columnDataType',
    },
  ] as Array<EuiTableFieldDataColumnType<any>>;

  const renderAccelerationDetailsFlyout = getRenderAccelerationDetailsFlyout();

  useEffect(() => {
    if (tableDetail && !tableDetail.columns) {
      startLoading(datasourceName, tableDetail.database, tableDetail.name);
    } else if (tableDetail && tableDetail.columns) {
      setTableColumns(tableDetail.columns);
    }
  }, []);

  useEffect(() => {
    if (loadStatus.toLowerCase() === DirectQueryLoadingStatus.SUCCESS) {
      let columns;
      try {
        columns = CatalogCacheManager.getTable(
          datasourceName,
          tableDetail.database,
          tableDetail.name
        ).columns;
        setTableColumns(columns);
      } catch (error) {
        setToast('Your cache is outdated, refresh databases and tables', 'warning');
      }
    }
  }, [loadStatus]);

  useEffect(() => {
    setSchemaData(
      tableColumns?.map((column, index) => ({
        name: column.fieldName,
        dataType: column.dataType,
        id: index,
      }))
    );
  }, [tableColumns]);

  const renderCreateAccelerationFlyout = getRenderCreateAccelerationFlyout();

  return (
    <>
      <EuiFlyoutHeader hasBorder>
        <EuiFlexGroup direction="row" alignItems="center" gutterSize="m">
          <EuiFlexItem>
            <EuiText size="m">
              <h2 className="accsDetailFlyoutTitle">{tableDetail.name}</h2>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <DiscoverButton />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <AccelerateButton />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <ConnectionComponent />
        <EuiSpacer />
        <TableTitleComponent title="Accelerations" />
        {accelerationData.length > 0 ? (
          <>
            <EuiInMemoryTable
              items={accelerationData}
              columns={accelerationColumns}
              pagination={true}
              sorting={true}
            />
          </>
        ) : (
          noDataMessage
        )}
        <EuiSpacer />
        <TableTitleComponent title="Schema" />
        <EuiInMemoryTable
          items={schemaData}
          columns={schemaColumns}
          pagination={true}
          sorting={true}
          loading={isCatalogCacheFetching(loadStatus)}
        />
      </EuiFlyoutBody>
    </>
  );
};
