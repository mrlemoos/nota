#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/// ObjC entry point implemented in Swift (`ClerkViewFactory.swift`).
/// Registers Clerk's native view factory with the ClerkExpo module at launch.
@interface ClerkNativeBootstrap : NSObject

+ (void)registerIfNeeded;

@end

NS_ASSUME_NONNULL_END
