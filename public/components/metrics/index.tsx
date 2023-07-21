/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './index.scss';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiGlobalToastList,
  EuiPage,
  EuiPageBody,
  EuiPanel,
  htmlIdGenerator,
  OnTimeChangeProps,
  ShortDate,
} from '@elastic/eui';
import { DurationRange } from '@elastic/eui/src/components/date_picker/types';
import React, { useEffect, useState } from 'react';
import { HashRouter, Route, RouteComponentProps } from 'react-router-dom';
import classNames from 'classnames';
import { StaticContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChromeBreadcrumb, CoreStart, Toast } from '../../../../../src/core/public';
import { onTimeChange } from './helpers/utils';
import { Sidebar } from './sidebar/sidebar';
import { EmptyMetricsView } from './view/empty_view';
import PPLService from '../../services/requests/ppl';
import { TopMenu } from './top_menu/top_menu';
import { MetricType } from '../../../common/types/metrics';
import { MetricsGrid } from './view/metrics_grid';
import { metricsLayoutSelector, selectedMetricsSelector } from './redux/slices/metrics_slice';
import { resolutionOptions } from '../../../common/constants/metrics';
import SavedObjects from '../../services/saved_objects/event_analytics/saved_objects';
import { observabilityLogsID } from '../../../common/constants/shared';
import { SelectedPanel } from './sidebar/selected_panel';

interface MetricsProps {
  http: CoreStart['http'];
  chrome: CoreStart['chrome'];
  parentBreadcrumb: ChromeBreadcrumb;
  renderProps: RouteComponentProps<any, StaticContext, any>;
  pplService: PPLService;
  savedObjects: SavedObjects;
  setBreadcrumbs: (newBreadcrumbs: ChromeBreadcrumb[]) => void;
}

export const Home = ({ chrome, parentBreadcrumb, savedObjects }: MetricsProps) => {
  // Redux tools
  const selectedMetrics = useSelector(selectedMetricsSelector);
  const metricsLayout = useSelector(metricsLayoutSelector);

  // Date picker constants
  const [recentlyUsedRanges, setRecentlyUsedRanges] = useState<DurationRange[]>([]);
  const [startTime, setStartTime] = useState<ShortDate>('now-1d');
  const [endTime, setEndTime] = useState<ShortDate>('now');

  // Top panel
  const [IsTopPanelDisabled, setIsTopPanelDisabled] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [onRefresh, setOnRefresh] = useState(false);
  const [editActionType, setEditActionType] = useState('');
  const [resolutionValue, setResolutionValue] = useState(resolutionOptions[2].value);
  const [spanValue, setSpanValue] = useState(1);
  const resolutionSelectId = htmlIdGenerator('resolutionSelect')();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastRightSide, setToastRightSide] = useState<boolean>(true);

  // Side bar constants
  const [isSidebarClosed, setIsSidebarClosed] = useState(false);

  // Metrics constants
  const [panelVisualizations, setPanelVisualizations] = useState<MetricType[]>([]);

  const setToast = (title: string, color = 'success', text?: ReactChild, side?: string) => {
    if (!text) text = '';
    setToastRightSide(!side ? true : false);
    setToasts([...toasts, { id: new Date().toISOString(), title, text, color } as Toast]);
  };

  const onRefreshFilters = (startTimeFilter: ShortDate, endTimeFilter: ShortDate) => {
    if (spanValue < 1) {
      setToast('Please add a valid span interval', 'danger');
      return;
    }
    setOnRefresh(!onRefresh);
  };

  const onDatePickerChange = (props: OnTimeChangeProps) => {
    onTimeChange(
      props.start,
      props.end,
      recentlyUsedRanges,
      setRecentlyUsedRanges,
      setStartTime,
      setEndTime
    );
    onRefreshFilters(props.start, props.end);
  };

  const onEditClick = (savedVisualizationId: string) => {
    window.location.assign(`${observabilityLogsID}#/explorer/${savedVisualizationId}`);
  };

  const onSideBarClick = () => {
    setIsSidebarClosed((staleState) => {
      return !staleState;
    });
    setTimeout(function () {
      window.dispatchEvent(new Event('resize'));
    }, 300);
  };

  useEffect(() => {
    chrome.setBreadcrumbs([
      parentBreadcrumb,
      {
        text: 'Metrics',
        href: `#/`,
      },
    ]);
  }, []);

  useEffect(() => {
    if (!editMode) {
      selectedMetrics.length > 0 ? setIsTopPanelDisabled(false) : setIsTopPanelDisabled(true); // eslint-disable-line
    } else {
      setIsTopPanelDisabled(true);
    }
  }, [selectedMetrics, editMode]);

  useEffect(() => {
    setPanelVisualizations(metricsLayout);
  }, [metricsLayout]);

  const mainSectionClassName = classNames({
    'col-md-10': !isSidebarClosed,
    'col-md-12': isSidebarClosed,
  });

  const sidebarClassName = classNames({
    closed: isSidebarClosed,
  });

  return (
    <>
      <EuiGlobalToastList
        toasts={toasts}
        dismissToast={(removedToast) => {
          setToasts(toasts.filter((toast) => toast.id !== removedToast.id));
        }}
        side={toastRightSide ? 'right' : 'left'}
        toastLifeTimeMs={6000}
      />
      <HashRouter>
        <Route
          exact
          path="/"
          render={(props) => (
            <div>
              <EuiPage>
                <EuiPageBody component="div">
                  <TopMenu
                    IsTopPanelDisabled={IsTopPanelDisabled}
                    startTime={startTime}
                    endTime={endTime}
                    onDatePickerChange={onDatePickerChange}
                    recentlyUsedRanges={recentlyUsedRanges}
                    editMode={editMode}
                    setEditMode={setEditMode}
                    setEditActionType={setEditActionType}
                    panelVisualizations={panelVisualizations}
                    setPanelVisualizations={setPanelVisualizations}
                    resolutionValue={resolutionValue}
                    setResolutionValue={setResolutionValue}
                    spanValue={spanValue}
                    setSpanValue={setSpanValue}
                    resolutionSelectId={resolutionSelectId}
                    setToast={setToast}
                  />
                  <EuiFlexGroup direction={'row'} gutterSize={'none'}>
                    <EuiFlexItem className="obsMetric obsMetric-available" grow={false}>
                      <Sidebar />
                    </EuiFlexItem>
                    <EuiFlexItem className="obsMetric obsMetric-selected" grow={false}>
                      <SelectedPanel />
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiPanel>
                        {selectedMetrics.length > 0 ? (
                          <MetricsGrid
                            chrome={chrome}
                            panelVisualizations={panelVisualizations}
                            setPanelVisualizations={setPanelVisualizations}
                            editMode={editMode}
                            startTime={startTime}
                            endTime={endTime}
                            moveToEvents={onEditClick}
                            onRefresh={onRefresh}
                            editActionType={editActionType}
                            setEditActionType={setEditActionType}
                            spanParam={spanValue + resolutionValue}
                          />
                        ) : (
                          <EmptyMetricsView />
                        )}
                      </EuiPanel>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiPageBody>
              </EuiPage>
            </div>
          )}
        />
      </HashRouter>
    </>
  );
};
