/*
 * Copyright 2012  Research Studios Austria Forschungsges.m.b.H.
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

package won.bot.framework.eventbot.behaviour;

import java.net.URI;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.apache.jena.query.Dataset;
import org.apache.jena.query.DatasetFactory;
import org.apache.jena.shared.PrefixMapping;
import org.apache.jena.shared.impl.PrefixMappingImpl;
import org.apache.jena.sparql.path.Path;
import org.apache.jena.sparql.path.PathParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import won.bot.framework.eventbot.EventListenerContext;
import won.bot.framework.eventbot.action.BaseEventBotAction;
import won.bot.framework.eventbot.action.EventBotAction;
import won.bot.framework.eventbot.action.impl.crawl.CrawlAction;
import won.bot.framework.eventbot.event.Event;
import won.bot.framework.eventbot.event.impl.cmd.CommandResultEvent;
import won.bot.framework.eventbot.event.impl.crawl.CrawlCommandEvent;
import won.bot.framework.eventbot.event.impl.crawl.CrawlCommandFailureEvent;
import won.bot.framework.eventbot.event.impl.crawl.CrawlCommandSuccessEvent;
import won.bot.framework.eventbot.event.impl.crawlconnection.CrawlConnectionCommandEvent;
import won.bot.framework.eventbot.event.impl.crawlconnection.CrawlConnectionCommandFailureEvent;
import won.bot.framework.eventbot.event.impl.crawlconnection.CrawlConnectionCommandSuccessEvent;
import won.bot.framework.eventbot.filter.impl.CommandResultFilter;
import won.bot.framework.eventbot.filter.impl.OrFilter;
import won.bot.framework.eventbot.filter.impl.SameEventFilter;
import won.bot.framework.eventbot.listener.EventListener;
import won.bot.framework.eventbot.listener.impl.ActionOnEventListener;
import won.bot.framework.eventbot.listener.impl.ActionOnFirstEventListener;
import won.protocol.util.RdfUtils;
import won.protocol.util.linkeddata.CachingLinkedDataSource;
import won.protocol.util.linkeddata.LinkedDataSource;
import won.protocol.util.linkeddata.WonLinkedDataUtils;
import won.protocol.vocabulary.WON;
import won.protocol.vocabulary.WONMSG;

/**
 * Crawls the complete connection data.
 * This behaviour is transient, it is only active once for a specific activity and then deactivates itself.
 */
public class CrawlConnectionDataBehaviour extends BotBehaviour {
    private final Logger logger = LoggerFactory.getLogger(getClass());
    private CrawlConnectionCommandEvent command;
    private Duration abortTimeout;

    public CrawlConnectionDataBehaviour(EventListenerContext context, CrawlConnectionCommandEvent command, Duration abortTimeout) {
        super(context);
        this.command = command;
        this.abortTimeout = abortTimeout;
    }

    public CrawlConnectionDataBehaviour(EventListenerContext context, String name, CrawlConnectionCommandEvent command, Duration abortTimeout) {
        super(context, name);
        this.command = command;
        this.abortTimeout = abortTimeout;
    }

    @Override
    protected void onActivate(Optional<Object> message) {
        logger.debug("activating crawling connection data for connection {}", command.getConnectionURI());
        logger.debug("will deactivate autmatically after " + abortTimeout );
        LinkedDataSource linkedDataSource = context.getLinkedDataSource();
        if (linkedDataSource instanceof CachingLinkedDataSource) {
        	URI toInvalidate = WonLinkedDataUtils.getEventContainerURIforConnectionURI(command.getConnectionURI(), linkedDataSource);
        	((CachingLinkedDataSource)linkedDataSource).invalidate(toInvalidate);
        	((CachingLinkedDataSource)linkedDataSource).invalidate(toInvalidate, command.getNeedURI());
        	URI remoteConnectionUri = WonLinkedDataUtils.getRemoteConnectionURIforConnectionURI(command.getConnectionURI(), linkedDataSource);
        	toInvalidate = WonLinkedDataUtils.getEventContainerURIforConnectionURI(remoteConnectionUri, linkedDataSource);
        	((CachingLinkedDataSource)linkedDataSource).invalidate(toInvalidate);
        	((CachingLinkedDataSource)linkedDataSource).invalidate(toInvalidate, command.getNeedURI());
        }
        context.getTaskScheduler().schedule(
                new Runnable() {
                    @Override
                    public void run() {
                        deactivate();
                    }
                }, new Date(System.currentTimeMillis() + abortTimeout.toMillis()));
        ;

        
        List<Path> propertyPaths = new ArrayList<>();
        PrefixMapping pmap = new PrefixMappingImpl();
        pmap.withDefaultMappings(PrefixMapping.Standard);
        pmap.setNsPrefix("won", WON.getURI());
        pmap.setNsPrefix("msg", WONMSG.getURI());
        propertyPaths.add(PathParser.parse("won:hasEventContainer", pmap));
        propertyPaths.add(PathParser.parse("won:hasEventContainer/rdfs:member", pmap));
        CrawlCommandEvent crawlNeedCommandEvent = new CrawlCommandEvent(command.getNeedURI(), command.getNeedURI(),
                propertyPaths, 10000, 5);

        propertyPaths = new ArrayList<Path>();
        propertyPaths.add(PathParser.parse("won:hasEventContainer", pmap));
        propertyPaths.add(PathParser.parse("won:hasEventContainer/rdfs:member", pmap));
        propertyPaths.add(PathParser.parse("won:hasEventContainer/rdfs:member/msg:hasCorrespondingRemoteMessage", pmap));
        propertyPaths.add(PathParser.parse("won:hasRemoteNeed", pmap));
        propertyPaths.add(PathParser.parse("won:hasRemoteNeed/won:hasEventContainer", pmap));
        propertyPaths.add(PathParser.parse("won:hasRemoteNeed/won:hasEventContainer/rdfs:member", pmap));
        propertyPaths.add(PathParser.parse("won:hasRemoteConnection", pmap));
        propertyPaths.add(PathParser.parse("won:hasRemoteConnection/won:hasEventContainer", pmap));
        propertyPaths.add(PathParser.parse("won:hasRemoteConnection/won:hasEventContainer/rdfs:member", pmap));
        propertyPaths.add(PathParser.parse("won:hasRemoteConnection/won:hasEventContainer/rdfs:member/msg:hasCorrespondingRemoteMessage", pmap));
        CrawlCommandEvent crawlConnectionCommandEvent = new CrawlCommandEvent(command.getNeedURI(), command.getConnectionURI(), propertyPaths, 10000, 5);


        Dataset crawledData = DatasetFactory.createGeneral();

        //add crawlcommand listener
        this.subscribeWithAutoCleanup(CrawlCommandEvent.class,
                new ActionOnEventListener(context,
                        new OrFilter(
                                new SameEventFilter(crawlNeedCommandEvent),
                                new SameEventFilter(crawlConnectionCommandEvent)
                        ),
                        new CrawlAction(context)));

        //when the first crawl succeeds, start the second
        this.subscribeWithAutoCleanup(CrawlCommandSuccessEvent.class,
                new ActionOnEventListener(context,
                        new CommandResultFilter(crawlNeedCommandEvent),
                        new BaseEventBotAction(context) {
                    @Override
                    protected void doRun(Event event, EventListener executingListener) throws Exception {
                        logger.debug("finished crawling need data. ");
                        Dataset dataset = ((CrawlCommandSuccessEvent) event).getCrawledData();
                        RdfUtils.addDatasetToDataset(crawledData, dataset);
                        //now crawl connection data
                        context.getEventBus().publish(crawlConnectionCommandEvent);
                    }
                }
                ));

        //when we're done crawling, validate:
        this.subscribeWithAutoCleanup(CrawlCommandSuccessEvent.class,
                new ActionOnEventListener(context,
                        new CommandResultFilter(crawlConnectionCommandEvent),
                        new BaseEventBotAction(context) {
                    @Override
                    protected void doRun(Event event, EventListener executingListener) throws Exception {
                        logger.debug("finished crawling need data for connection {}", command.getConnectionURI());
                        Dataset dataset = ((CrawlCommandSuccessEvent) event).getCrawledData();
                        RdfUtils.addDatasetToDataset(crawledData, dataset);
                        context.getEventBus().publish(new CrawlConnectionCommandSuccessEvent(command, crawledData));
                        deactivate();
                    }
                }
                ));

        //when something goes wrong, abort
        this.subscribeWithAutoCleanup(CrawlCommandFailureEvent.class,
                new ActionOnFirstEventListener(context,
                        new OrFilter(
                            new CommandResultFilter(crawlConnectionCommandEvent),
                            new CommandResultFilter(crawlNeedCommandEvent)
                        ),
                        new BaseEventBotAction(context) {
                            @Override
                            protected void doRun(Event event, EventListener executingListener) throws Exception {
                                CrawlCommandFailureEvent failureEvent = (CrawlCommandFailureEvent) event;
                                logger.debug("crawling failed for connection {}, message: {}", command.getConnectionURI(), failureEvent.getMessage());
                                context.getEventBus().publish(new CrawlConnectionCommandFailureEvent(failureEvent.getMessage(), command));
                                deactivate();
                            }
                        })
        );
        //start crawling the need  - connection will be crawled when need crawling is done
        context.getEventBus().publish(crawlNeedCommandEvent);
    }

    public void onResult(EventBotAction task) {
        subscribeWithAutoCleanup(CommandResultEvent.class,
                new ActionOnFirstEventListener(context, new CommandResultFilter(command), task));
    }
}
