/*
 * Copyright 2012 Research Studios Austria Forschungsges.m.b.H. Licensed under
 * the Apache License, Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of the License
 * at http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable
 * law or agreed to in writing, software distributed under the License is
 * distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
package won.bot.framework.eventbot.event.impl.cmd;

/**
 * Base class for success events.
 */
public abstract class BaseCommandSuccessEvent<C extends CommandEvent> implements CommandSuccessEvent<C> {
    private String message;
    private C originalCommandEvent;

    private BaseCommandSuccessEvent() {
    }

    public BaseCommandSuccessEvent(String message, C originalCommandEvent) {
        this.message = message;
        this.originalCommandEvent = originalCommandEvent;
    }

    public BaseCommandSuccessEvent(C originalCommandEvent) {
        this.originalCommandEvent = originalCommandEvent;
    }

    @Override
    public String getMessage() {
        return message;
    }

    @Override
    public C getOriginalCommandEvent() {
        return originalCommandEvent;
    }

    @Override
    public boolean isSuccess() {
        return true;
    }
}
