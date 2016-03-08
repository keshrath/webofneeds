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

package won.bot.framework.events.listener.impl;

import com.hp.hpl.jena.query.Dataset;
import com.hp.hpl.jena.rdf.model.Model;
import won.bot.framework.events.EventListenerContext;
import won.bot.framework.events.action.EventBotActionUtils;
import won.bot.framework.events.event.ConnectionSpecificEvent;
import won.bot.framework.events.event.Event;
import won.bot.framework.events.event.impl.monitor.MessageDispatchStartedEvent;
import won.bot.framework.events.event.impl.monitor.MessageDispatchedEvent;
import won.bot.framework.events.filter.EventFilter;
import won.bot.framework.events.listener.AbstractHandleFirstNEventsListener;
import won.protocol.exception.WonMessageBuilderException;
import won.protocol.message.WonMessage;
import won.protocol.message.WonMessageBuilder;
import won.protocol.service.WonNodeInformationService;
import won.protocol.util.RdfUtils;
import won.protocol.util.WonRdfUtils;

import java.net.URI;
import java.util.Date;

/**
 * Listener that responds to open and message events with automatic messages.
 * Can be configured to apply a timeout (non-blocking) before sending messages.
 * Can be configured to send a fixed number of messages and then unsubscribe from events.
 */
public class AutomaticMonitoredMessageResponderListener extends AbstractHandleFirstNEventsListener
{
  private long millisTimeoutBeforeReply = 1000;

  public AutomaticMonitoredMessageResponderListener(final EventListenerContext context, final int targetNumberOfMessages, final long millisTimeoutBeforeReply)
  {
    super(context, targetNumberOfMessages);
    this.millisTimeoutBeforeReply = millisTimeoutBeforeReply;
  }

  public AutomaticMonitoredMessageResponderListener(final EventListenerContext context, final EventFilter eventFilter, final int targetCount, final long millisTimeoutBeforeReply)
  {
    super(context, eventFilter, targetCount);
    this.millisTimeoutBeforeReply = millisTimeoutBeforeReply;
  }

  public AutomaticMonitoredMessageResponderListener(final EventListenerContext context, final String name, final int targetCount, final long millisTimeoutBeforeReply)
  {
    super(context, name, targetCount);
    this.millisTimeoutBeforeReply = millisTimeoutBeforeReply;
  }

  public AutomaticMonitoredMessageResponderListener(final EventListenerContext context, final String name, final EventFilter eventFilter, final int targetCount, final long millisTimeoutBeforeReply)
  {
    super(context, name, eventFilter, targetCount);
    this.millisTimeoutBeforeReply = millisTimeoutBeforeReply;
  }

  @Override
  protected void handleFirstNTimes(final Event event) throws Exception
  {
    if (event instanceof ConnectionSpecificEvent){
      handleMessageEvent((ConnectionSpecificEvent) event);
    }
  }

  private void handleMessageEvent(final ConnectionSpecificEvent messageEvent){
    getEventListenerContext().getTaskScheduler().schedule(new Runnable()
    {
      @Override
      public void run()
      {

        EventListenerContext ctx = getEventListenerContext();
        String message = createMessage();
        Model messageContent = WonRdfUtils.MessageUtils.textMessage(message);
        URI connectionUri = messageEvent.getConnectionURI();

        WonMessage wonMessage = createWonMessage(connectionUri, messageContent);
        //remember the message URI so we can react to success/failure responses
        final URI msgURI = wonMessage.getMessageURI();
        EventBotActionUtils.rememberInListIfNamePresent(ctx, msgURI, "msgURIs");

        logger.debug("sending message " + message);
        try {
          // fire start message sending monitor event (message sending includes signing)
          ctx.getEventBus().publish(new MessageDispatchStartedEvent(msgURI));
          ctx.getWonMessageSender().sendWonMessage(wonMessage);
          // fire message is sent monitor event
          ctx.getEventBus().publish(new MessageDispatchedEvent(msgURI));
        } catch (Exception e) {
          logger.warn("could not send message via connection {}", connectionUri, e);
        }
      }
    }, new Date(System.currentTimeMillis() + this.millisTimeoutBeforeReply));
  }

  private String createMessage()
  {
    String message = "auto reply no " + (getCount());
    if (getTargetCount() > 0){
      message += " of " + getTargetCount();
    }
    message +=  "(delay: "+ millisTimeoutBeforeReply + " millis)";
    return message;
  }

  @Override
  protected void unsubscribe()
  {
    logger.debug("unsubscribing from all events");
    getEventListenerContext().getEventBus().unsubscribe(this);
  }

  private WonMessage createWonMessage(URI connectionURI, Model content) throws WonMessageBuilderException {

    WonNodeInformationService wonNodeInformationService =
      getEventListenerContext().getWonNodeInformationService();


    Dataset connectionRDF =
      getEventListenerContext().getLinkedDataSource().getDataForResource(connectionURI);
    URI remoteNeed = WonRdfUtils.NeedUtils.getRemoteNeedURIFromConnection(connectionRDF, connectionURI);
    URI localNeed = WonRdfUtils.NeedUtils.getLocalNeedURIFromConnection(connectionRDF, connectionURI);
    URI wonNode = WonRdfUtils.NeedUtils.getWonNodeURIFromConnection(connectionRDF, connectionURI);
    Dataset remoteNeedRDF =
      getEventListenerContext().getLinkedDataSource().getDataForResource(remoteNeed);

    URI messageURI = wonNodeInformationService.generateEventURI(wonNode);
    RdfUtils.replaceBaseURI(content, messageURI.toString());

    WonMessageBuilder builder = new WonMessageBuilder();
    return builder
      .setMessagePropertiesForConnectionMessage(
        messageURI,
        connectionURI,
        localNeed,
        wonNode,
        WonRdfUtils.NeedUtils.getRemoteConnectionURIFromConnection(connectionRDF, connectionURI),
        remoteNeed,
        WonRdfUtils.NeedUtils.getWonNodeURIFromNeed(remoteNeedRDF, remoteNeed),
        content)
      .build();
  }

}
